"use server";

import { db } from "@/db";
import { orders, customers, orderItems } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { sql, eq, isNull, and } from "drizzle-orm";
import { subDays } from "date-fns";

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
    .where(and(
      sql`${orders.createdAt} >= ${thirtyDaysAgo.toISOString()}`,
      isNull(orders.deletedAt),
    ))
    .groupBy(sql`date_trunc('day', ${orders.createdAt} at time zone 'Asia/Manila')`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt} at time zone 'Asia/Manila') ASC`);

  return results.map(row => ({
    date: row.date,
    revenue: Number(row.revenue) || 0
  }));
}

export async function getOrderStatusDistribution() {
  await requireAuth();

  const results = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)`,
    })
    .from(orders)
    .where(isNull(orders.deletedAt))
    .groupBy(orders.status);

  return results.map((row) => ({
    status: row.status,
    count: Number(row.count) || 0,
    revenue: Number(row.revenue) || 0,
  }));
}

export async function getTopCustomers(limit = 5) {
  await requireAuth();

  const results = await db
    .select({
      id: customers.id,
      name: customers.name,
      orderCount: sql<number>`count(${orders.id})::int`,
      totalSpent: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)`,
    })
    .from(customers)
    .leftJoin(
      orders,
      and(eq(orders.customerId, customers.id), isNull(orders.deletedAt)),
    )
    .groupBy(customers.id, customers.name)
    .orderBy(sql`coalesce(sum(${orders.totalAmount}::numeric), 0) DESC`)
    .limit(limit);

  return results
    .filter((r) => Number(r.orderCount) > 0)
    .map((row) => ({
      id: row.id,
      name: row.name,
      orderCount: Number(row.orderCount) || 0,
      totalSpent: Number(row.totalSpent) || 0,
    }));
}

export async function getProductTypeBreakdown() {
  await requireAuth();

  const results = await db
    .select({
      productType: orderItems.productType,
      itemCount: sql<number>`count(*)::int`,
      totalRevenue: sql<number>`coalesce(sum(${orderItems.unitPrice}::numeric * ${orderItems.quantity}::numeric), 0)`,
    })
    .from(orderItems)
    .groupBy(orderItems.productType)
    .orderBy(sql`coalesce(sum(${orderItems.unitPrice}::numeric * ${orderItems.quantity}::numeric), 0) DESC`);

  return results.map((row) => ({
    productType: row.productType,
    itemCount: Number(row.itemCount) || 0,
    totalRevenue: Number(row.totalRevenue) || 0,
  }));
}
