import "server-only";

import { and, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import type { PriceMemoryRow } from "@/lib/price-memory-rank";

/** Rows kept per product type; rankPriceMemory picks the best 3 of these. */
const PER_TYPE = 8;

/**
 * Recently charged prices for every product type in one round trip: a window
 * function numbers each product type's items newest first (this customer's
 * first, when given) and keeps the top few, instead of one query per item.
 * Deleted orders and items charged at 0 are skipped.
 */
export async function loadPriceMemory(customerId?: string): Promise<PriceMemoryRow[]> {
  const mine = customerId ? sql`(${orders.customerId} = ${customerId})` : sql`false`;
  const ranked = db
    .select({
      productType: orderItems.productType,
      unitPrice: orderItems.unitPrice,
      quantity: orderItems.quantity,
      dimensions: orderItems.dimensions,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      customerId: orders.customerId,
      rn: sql<number>`row_number() over (partition by ${orderItems.productType} order by ${mine} desc, ${orders.createdAt} desc)`.as(
        "rn",
      ),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(isNull(orders.deletedAt), gt(orderItems.unitPrice, "0")))
    .as("ranked");

  const rows = await db.select().from(ranked).where(lte(ranked.rn, PER_TYPE));
  return rows.map((r) => ({
    productType: r.productType,
    unitPrice: Number(r.unitPrice),
    quantity: r.quantity,
    dimensions: r.dimensions,
    orderNumber: r.orderNumber,
    createdAt: new Date(r.createdAt).toISOString(),
    customerId: r.customerId,
  }));
}
