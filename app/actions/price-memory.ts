"use server";

import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { loadPriceMemory } from "@/lib/price-memory";
import type { PriceMemoryRow } from "@/lib/price-memory-rank";

/** Recently charged prices per product, this customer's first when given. */
export async function getPriceMemory(customerId?: string): Promise<PriceMemoryRow[]> {
  await requireAuth();
  const id = z.uuid().safeParse(customerId);
  return loadPriceMemory(id.success ? id.data : undefined);
}
