"use server";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { sql } from "drizzle-orm";
import { subDays, format } from "date-fns";

export async function getRevenueOverTime() {
  await requireAuth();

  const thirtyDaysAgo = subDays(new Date(), 30);
  
  // Group by date (truncating to day)
  const results = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${orders.createdAt} at time zone 'Asia/Manila'), 'YYYY-MM-DD')`,
      revenue: sql<number>`sum(${orders.totalAmount}::numeric)`
    })
    .from(orders)
    .where(sql`${orders.createdAt} >= ${thirtyDaysAgo}`)
    .groupBy(sql`date_trunc('day', ${orders.createdAt} at time zone 'Asia/Manila')`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt} at time zone 'Asia/Manila') ASC`);

  return results.map(row => ({
    date: row.date,
    revenue: Number(row.revenue) || 0
  }));
}
