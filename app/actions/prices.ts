"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { db } from "@/db";
import { PRICE_UNITS, PRODUCT_TYPES, pricePresets } from "@/db/schema";
import { requireAdmin, requireAuth } from "@/lib/auth";

export type PricePresetView = {
  id: string;
  productType: (typeof PRODUCT_TYPES)[number];
  label: string;
  unit: (typeof PRICE_UNITS)[number];
  price: string;
};

/** The shop's price list, for the order forms and the Price list page. */
export async function getPricePresets(): Promise<PricePresetView[]> {
  await requireAuth();
  const rows = await db
    .select({
      id: pricePresets.id,
      productType: pricePresets.productType,
      label: pricePresets.label,
      unit: pricePresets.unit,
      price: pricePresets.price,
    })
    .from(pricePresets)
    .where(isNull(pricePresets.archivedAt))
    .orderBy(asc(pricePresets.productType), asc(pricePresets.sortOrder), asc(pricePresets.label));
  return rows.map((r) => ({ ...r, unit: r.unit === "sqft" ? "sqft" : "piece" }));
}

const presetSchema = z.object({
  id: z.string().uuid().optional(),
  productType: z.enum(PRODUCT_TYPES),
  label: z.string().trim().min(2, "Give the price a name, e.g. “Sublimation print”").max(60),
  unit: z.enum(PRICE_UNITS),
  price: z.coerce.number().min(0, "Price can't be negative").max(1_000_000),
});

export type PricePresetInput = z.input<typeof presetSchema>;

export async function savePricePreset(input: PricePresetInput) {
  let userId: string;
  try {
    userId = (await requireAdmin()).user.id;
  } catch {
    return { error: "Only an admin can change the price list." };
  }
  const parsed = presetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the price" };
  const { id, ...v } = parsed.data;
  const values = { ...v, price: v.price.toFixed(2) };

  if (id) {
    const updated = await db
      .update(pricePresets)
      .set(values)
      .where(and(eq(pricePresets.id, id), isNull(pricePresets.archivedAt)))
      .returning({ id: pricePresets.id });
    if (updated.length === 0) return { error: "That price was removed. Reload the page." };
  } else {
    await db.insert(pricePresets).values({ ...values, createdBy: userId });
  }
  revalidatePath("/dashboard/prices");
  return { success: true };
}

/** Prices are archived rather than deleted, so nothing that referenced them breaks. */
export async function archivePricePreset(id: string) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Only an admin can change the price list." };
  }
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "Invalid price" };
  await db.update(pricePresets).set({ archivedAt: new Date() }).where(eq(pricePresets.id, parsed.data));
  revalidatePath("/dashboard/prices");
  return { success: true };
}
