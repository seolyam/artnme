"use server";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { getSessionProfile } from "@/lib/auth";
import { findCustomerByContact } from "@/lib/customer-match";
import { aiStaffEnabled } from "@/lib/ai/flags";
import type { AiFailure } from "@/lib/ai/call";
import { buildApplyPayload } from "@/lib/ai/order-draft/apply";
import { draftOrderFromText } from "@/lib/ai/order-draft/extract";
import type { ResolvedDraft } from "@/lib/ai/order-draft/resolve";
import { MAX_CHAT_CHARS, newCustomerPrefill } from "@/lib/ai/order-draft/to-form";
import { logOrderEvent } from "@/lib/order-events";
import { isWebQuote, stripQuoteMeta } from "@/lib/order-status";
import { createThrottle } from "@/lib/rate-limit";
import { orderItemSchema, type OrderFormValues } from "@/lib/validators";
import { updateOrder } from "./orders";
import { getPricePresets } from "./prices";

// Read-only: these actions draft, they never write. Saving goes through the
// normal createOrder/updateOrder validation after a staff click.

const throttle = createThrottle({ windowMs: 10 * 60 * 1000, max: 20 });
const chatSchema = z.string().trim().min(10).max(MAX_CHAT_CHARS);

export type DraftCustomer =
  | { kind: "matched"; id: string; name: string; via: "phone" | "email" }
  | { kind: "new"; name: string; contact: string; email: string; messenger: string };

export type ChatDraftResponse =
  | { ok: true; draft: ResolvedDraft; customer: DraftCustomer | null; messengerLink: string | null }
  | { ok: false; reason: "disabled" | "throttled" | "too_short" | AiFailure; message: string };

const FAILURE_MESSAGE = "Couldn't read that chat. Fill the form as usual.";

async function matchCustomer(contacts: { phones: string[]; emails: string[] }) {
  for (const [list, via] of [
    [contacts.phones, "phone"],
    [contacts.emails, "email"],
  ] as const) {
    for (const c of list) {
      const row = await findCustomerByContact(db, c);
      if (row) return { kind: "matched" as const, id: row.id, name: row.name, via };
    }
  }
  return null;
}

export async function draftOrderFromChat(text: string): Promise<ChatDraftResponse> {
  const { user } = await getSessionProfile();
  if (!aiStaffEnabled()) return { ok: false, reason: "disabled", message: "AI drafting is turned off." };

  const parsed = chatSchema.safeParse(text);
  if (!parsed.success) {
    return { ok: false, reason: "too_short", message: `Paste the chat (10 to ${MAX_CHAT_CHARS} characters).` };
  }
  if (throttle.hit(user.id)) {
    return { ok: false, reason: "throttled", message: "Too many drafts in a few minutes. Try again shortly." };
  }

  const presets = await getPricePresets();
  const res = await draftOrderFromText(parsed.data, { presets, user: user.id });
  if (!res.ok) return { ok: false, reason: res.reason, message: FAILURE_MESSAGE };

  const matched = await matchCustomer(res.contacts);
  const fresh = matched ? undefined : newCustomerPrefill(res.draft.customerName, res.contacts);

  return {
    ok: true,
    draft: res.draft,
    customer: matched ?? (fresh ? { kind: "new", ...fresh } : null),
    messengerLink: res.contacts.messenger[0] ?? null,
  };
}

// ─── Web quote triage ───────────────────────────────────────────────────────

export type WebQuoteDraftResponse =
  | { ok: true; draft: ResolvedDraft; version: string }
  | { ok: false; reason: "disabled" | "throttled" | "not_a_quote" | AiFailure; message: string };

/** Identifies the order's state when it was read; Apply refuses if it moved on. */
function versionOf(order: { updatedAt: Date | null; createdAt: Date }) {
  return (order.updatedAt ?? order.createdAt).toISOString();
}

async function loadPendingQuote(orderId: string) {
  const id = z.uuid().safeParse(orderId);
  if (!id.success) return null;
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id.data), isNull(orders.deletedAt)));
  if (!order || !isWebQuote(order.title) || order.status !== "Pending") return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { order, items };
}

/** Read a pending web quote's free-text request and suggest priced items. */
export async function draftFromWebQuote(orderId: string): Promise<WebQuoteDraftResponse> {
  const { user } = await getSessionProfile();
  if (!aiStaffEnabled()) return { ok: false, reason: "disabled", message: "AI drafting is turned off." };

  const quote = await loadPendingQuote(orderId);
  if (!quote) return { ok: false, reason: "not_a_quote", message: "Only pending web quotes can be read." };
  if (throttle.hit(user.id)) {
    return { ok: false, reason: "throttled", message: "Too many drafts in a few minutes. Try again shortly." };
  }

  // The product the customer picked on the form is a hint; their message wins.
  const text = quote.items
    .map(
      (it) =>
        `Picked on the quote form: ${it.quantity} × ${it.productType} (the message may say otherwise).\n` +
        `Message:\n${stripQuoteMeta(it.description) || "(no message)"}`,
    )
    .join("\n\n")
    .slice(0, MAX_CHAT_CHARS);

  const presets = await getPricePresets();
  const res = await draftOrderFromText(text, { presets, user: user.id });
  if (!res.ok) return { ok: false, reason: res.reason, message: "Couldn't read this request. Price it as usual." };
  return { ok: true, draft: res.draft, version: versionOf(quote.order) };
}

const applySchema = z.object({
  items: z.array(orderItemSchema.omit({ id: true })).min(1).max(10),
  version: z.string().min(1),
  draftDue: z.string().optional(),
});

/** Save drafted items onto a web quote, through the normal updateOrder checks. */
export async function applyDraftItems(
  orderId: string,
  input: { items: unknown[]; version: string; draftDue?: string },
): Promise<{ ok: true } | { ok: false; stale?: boolean; message: string }> {
  const { user } = await getSessionProfile();
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "The drafted items aren't valid. Edit the order by hand." };

  const quote = await loadPendingQuote(orderId);
  if (!quote) return { ok: false, message: "Only pending web quotes can be updated this way." };
  // Optimistic concurrency: someone saved this order after it was read.
  if (versionOf(quote.order) !== parsed.data.version) {
    return { ok: false, stale: true, message: "This order changed since it was read. Reload and read it again." };
  }

  const payload = buildApplyPayload(
    { ...quote.order, status: quote.order.status as OrderFormValues["status"], items: quote.items },
    parsed.data.items,
    parsed.data.draftDue,
  );
  const res = await updateOrder(quote.order.id, payload);
  if (res.error) return { ok: false, message: res.error };

  await logOrderEvent(db, {
    orderId: quote.order.id,
    type: "note",
    message: "Items drafted from the customer's request (AI) and applied",
    actorId: user.id,
  });
  return { ok: true };
}
