"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, HelpCircle, MessageCircle, Sparkles, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { DraftCustomer } from "@/app/actions/ai-order-draft";
import type { FlagCode, ResolvedDraft } from "@/lib/ai/order-draft/resolve";
import { peso } from "@/lib/money";
import { rankPriceMemory, type PriceMemoryRow } from "@/lib/price-memory-rank";
import { formatShopDate, parseShopDateTime } from "@/lib/time";
import { formatContact } from "@/lib/phone";
import { cn } from "@/lib/utils";

const FLAG_STYLE: Record<FlagCode, string> = {
  rush: "border-[#f2b33d]/60 bg-[#f2b33d]/10",
  past_deadline: "border-accent-ink/50 bg-accent-ink/5",
  size_sum_mismatch: "border-[#f2b33d]/60 bg-[#f2b33d]/10",
  large_run: "border-[#f2b33d]/60 bg-[#f2b33d]/10",
  needs_price: "border-outline-variant/60",
  needs_quantity: "border-outline-variant/60",
};

const LANGUAGE: Record<ResolvedDraft["language"], string> = {
  english: "English",
  tagalog: "Tagalog",
  hiligaynon: "Hiligaynon",
  mixed: "mixed languages",
};

const action =
  "inline-flex min-h-9 items-center gap-1.5 border border-outline-variant/60 px-3 text-xs font-semibold transition-colors hover:border-on-surface-variant";

/**
 * What the AI understood from a chat or web quote: items with where each
 * price came from, warnings, who the customer is, what's still missing, and a
 * reply to send. Staff check this, then save through the normal form.
 */
export function OrderDraftResult({
  draft,
  customer,
  messengerLink,
  priceMemory = [],
  actions,
}: {
  draft: ResolvedDraft;
  customer?: DraftCustomer | null;
  messengerLink?: string | null;
  /** Recently charged prices, shown for items the price list didn't cover. */
  priceMemory?: PriceMemoryRow[];
  /** Buttons such as "Undo prefill" or "Apply items". */
  actions?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const items = draft.defaults.items ?? [];
  const due = draft.defaults.dueDate ? parseShopDateTime(draft.defaults.dueDate) : null;
  const orderFlags = draft.flags.filter((f) => f.item === undefined || f.code !== "needs_price");

  async function copyReply() {
    try {
      await navigator.clipboard.writeText(draft.replyDraft);
      setCopied(true);
      toast.success("Reply copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually");
    }
  }

  async function openMessenger() {
    await copyReply();
    window.open(messengerLink!, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        <Sparkles className="h-3.5 w-3.5" />
        AI draft. Check before saving
      </p>

      {draft.summary && <p className="font-medium">{draft.summary}</p>}

      {items.length > 0 ? (
        <ul className="divide-y divide-outline-variant/40 border border-outline-variant/60">
          {items.map((it, i) => {
            const p = draft.priced[i];
            const last =
              it.unitPrice > 0
                ? undefined
                : rankPriceMemory(priceMemory, {
                    productType: it.productType,
                    quantity: it.quantity,
                    customerId: customer?.kind === "matched" ? customer.id : undefined,
                  })[0];
            return (
              <li key={i} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {it.quantity} × {it.productType}
                    {it.dimensions ? <span className="font-normal text-on-surface-variant"> · {it.dimensions}</span> : null}
                  </p>
                  {it.description && (
                    <p className="whitespace-pre-line text-xs text-on-surface-variant">{it.description}</p>
                  )}
                  {last && (
                    <p className="text-xs text-on-surface-variant">
                      Last charged {peso(last.unitPrice)} · {last.quantity} pcs · #{String(last.orderNumber).padStart(4, "0")}
                      {last.labels.length ? ` · ${last.labels.join(", ")}` : ""}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 border px-2 py-0.5 text-xs",
                    it.unitPrice > 0 ? "border-outline-variant/60" : "border-dashed border-outline-variant text-on-surface-variant",
                  )}
                >
                  {p?.source === "preset"
                    ? it.unitPrice > 0
                      ? `Price list: ${p.label} ${peso(it.unitPrice)}`
                      : `${p.label} ${peso(p.price)}/sq ft · needs size`
                    : "No price yet"}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-on-surface-variant">No items found in this chat.</p>
      )}

      {due && (
        <p>
          <span className="text-on-surface-variant">Due</span>{" "}
          <span className="font-semibold">{formatShopDate(due, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
        </p>
      )}

      {orderFlags.length > 0 && (
        <ul className="space-y-1.5">
          {orderFlags.map((f, i) => (
            <li key={i} className={cn("flex items-start gap-2 border px-3 py-1.5", FLAG_STYLE[f.code])}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {f.message}
            </li>
          ))}
        </ul>
      )}

      {customer?.kind === "matched" && (
        <p className="flex items-start gap-2">
          <UserCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Matched existing customer <span className="font-semibold">{customer.name}</span> by {customer.via}. You can pick
            someone else below.
          </span>
        </p>
      )}
      {customer?.kind === "new" && (
        <p className="flex items-start gap-2">
          <UserPlus className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            New customer
            {customer.name ? <span className="font-semibold"> {customer.name}</span> : null}
            {customer.contact ? ` · ${formatContact(customer.contact)}` : ""}. Filled in below.
          </span>
        </p>
      )}

      {draft.questions.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-2 font-semibold">
            <HelpCircle className="h-4 w-4" />
            Still missing
          </p>
          <ul className="list-disc space-y-0.5 pl-6 text-on-surface-variant">
            {draft.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {draft.replyDraft && (
        <div className="space-y-2">
          <p className="font-semibold">
            Reply draft <span className="font-normal text-on-surface-variant">({LANGUAGE[draft.language]})</span>
          </p>
          <p className="whitespace-pre-line border border-outline-variant/60 bg-surface-container-lowest px-3 py-2">
            {draft.replyDraft}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copyReply} className={action}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy reply
            </button>
            {messengerLink && (
              <button type="button" onClick={openMessenger} className={action}>
                <MessageCircle className="h-3.5 w-3.5" />
                Copy and open Messenger
              </button>
            )}
          </div>
        </div>
      )}

      {actions && <div className="flex flex-wrap gap-2 border-t border-outline-variant/40 pt-3">{actions}</div>}
    </div>
  );
}
