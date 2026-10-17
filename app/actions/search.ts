"use server";

import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export type SearchResults = {
  orders: {
    orderNumber: number;
    title: string;
    status: string;
    customerName: string;
  }[];
  customers: { id: string; name: string; contactNumber: string | null }[];
};

/** Backs the ⌘K palette: order numbers, titles, customer names and phones. */
export async function searchEverything(query: string): Promise<SearchResults> {
  await requireAuth();
  const q = query.trim().slice(0, 80);
  if (!q) return { orders: [], customers: [] };

  // Escape LIKE wildcards so "50%" searches literally.
  const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const digits = q.replace(/^#/, "");
  const asNumber = /^\d{1,9}$/.test(digits) ? Number(digits) : null;

  const [orderRows, customerRows] = await Promise.all([
    db
      .select({
        orderNumber: orders.orderNumber,
        title: orders.title,
        status: orders.status,
        customerName: customers.name,
      })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(
        and(
          isNull(orders.deletedAt),
          or(
            asNumber !== null ? eq(orders.orderNumber, asNumber) : undefined,
            ilike(orders.title, pattern),
            ilike(customers.name, pattern),
          ),
        ),
      )
      .orderBy(
        // Exact order-number hits first, then newest.
        desc(sql`${orders.orderNumber} = ${asNumber ?? -1}`),
        desc(orders.createdAt),
      )
      .limit(8),
    db
      .select({
        id: customers.id,
        name: customers.name,
        contactNumber: customers.contactNumber,
      })
      .from(customers)
      .where(or(ilike(customers.name, pattern), ilike(customers.contactNumber, pattern)))
      .orderBy(customers.name)
      .limit(6),
  ]);

  return { orders: orderRows, customers: customerRows };
}
