"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod/v4";
import { db } from "@/db";
import { orderFiles, orderItems, type ProductType } from "@/db/schema";
import { getSessionProfile } from "@/lib/auth";
import { aiPublicEnabled, aiStaffEnabled } from "@/lib/ai/flags";
import { QUOTE_PRODUCTS } from "@/lib/validators";
import { reviewArtwork, type ArtworkReview } from "@/lib/ai/artwork/review";
import { cloudinaryPreviewUrl, fetchCapped } from "@/lib/ai/artwork/preview";
import { createThrottle } from "@/lib/rate-limit";

const throttle = createThrottle({ windowMs: 10 * 60 * 1000, max: 30 });

export type ArtworkReviewResponse = { ok: true; review: ArtworkReview } | { ok: false; message: string };

/** Staff: an AI look at a customer's file before it goes to the designer. Read-only. */
export async function reviewOrderFile(fileId: string): Promise<ArtworkReviewResponse> {
  const { user } = await getSessionProfile();
  if (!aiStaffEnabled()) return { ok: false, message: "AI checks are turned off." };
  const id = z.uuid().safeParse(fileId);
  if (!id.success) return { ok: false, message: "File not found." };

  const [file] = await db.select().from(orderFiles).where(eq(orderFiles.id, id.data));
  if (!file) return { ok: false, message: "File not found." };
  const preview = cloudinaryPreviewUrl(file.url, { pdf: file.mimeType === "application/pdf" || /\.pdf(\?|$)/i.test(file.url) });
  if (!preview) return { ok: false, message: "This file type can't be checked." };
  if (throttle.hit(user.id)) return { ok: false, message: "Too many checks in a few minutes. Try again shortly." };

  const image = await fetchCapped(preview);
  if (!image) return { ok: false, message: "Couldn't load the file. Try again." };

  const [item] = await db
    .select({ productType: orderItems.productType })
    .from(orderItems)
    .where(eq(orderItems.orderId, file.orderId))
    .limit(1);

  const res = await reviewArtwork({
    image,
    mediaType: "image/jpeg",
    productType: (item?.productType ?? "Other") as ProductType,
    audience: "staff",
    user: user.id,
  });
  if (!res.ok) return { ok: false, message: "Couldn't check this file right now." };
  return { ok: true, review: res.review };
}

// ─── Customer self-check on the quote form ──────────────────────────────────

const publicThrottle = createThrottle({ windowMs: 10 * 60 * 1000, max: 5 });
const MIN_FILL_MS = 2500; // same bot guard as submitQuote
const MAX_PREVIEW_BYTES = 2 * 1024 * 1024;

export type QuoteArtworkCheck =
  | { ok: true; printableAsIs: boolean; summary: string; hints: string[] }
  | { ok: false; message: string };

/** Public, opt-in: friendly notes on the customer's file before they send it.
 *  Never blocks the quote, and never mentions brand logos (staff handle those). */
export async function checkQuoteArtwork(formData: FormData): Promise<QuoteArtworkCheck> {
  if (!aiPublicEnabled()) return { ok: false, message: "File checks aren't available right now." };

  // Bots fill every field and act instantly; give them nothing useful.
  const honeypot = formData.get("company");
  const startedAt = Number(formData.get("startedAt"));
  if ((typeof honeypot === "string" && honeypot.length > 0) || (Number.isFinite(startedAt) && Date.now() - startedAt < MIN_FILL_MS)) {
    return { ok: true, printableAsIs: true, summary: "", hints: [] };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (publicThrottle.hit(ip)) return { ok: false, message: "Too many checks for now. You can still send your request." };

  const image = formData.get("image");
  if (!(image instanceof File) || image.type !== "image/jpeg" || image.size === 0 || image.size > MAX_PREVIEW_BYTES) {
    return { ok: false, message: "This file can't be checked. You can still send it." };
  }
  const product = QUOTE_PRODUCTS.find((p) => p.value === formData.get("product"));

  const res = await reviewArtwork({
    image: new Uint8Array(await image.arrayBuffer()),
    mediaType: "image/jpeg",
    productType: product?.productType ?? "Other",
    audience: "customer",
  });
  if (!res.ok) return { ok: false, message: "Couldn't check the file right now. You can still send it." };
  return {
    ok: true,
    printableAsIs: res.review.printableAsIs,
    summary: res.review.summary,
    hints: res.review.issues.map((i) => i.note),
  };
}
