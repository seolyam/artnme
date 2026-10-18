"use server";

import { and, asc, eq, gte, isNull, like, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, orderEvents, orders, payments, profiles } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { roundMoney, toNumber } from "@/lib/money";
import { eachDay, rangeBounds, resolveRange } from "@/lib/report-range";
import { daysUntil } from "@/lib/time";

export type DailyMoney = { date: string; booked: number; collected: number };

const shopDay = (col: unknown) => sql<string>`to_char(${col} AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD')`;

/**
 * Per-day money for a range, zero-filled.
 *  - booked:    value of orders taken that day (by order date)
 *  - collected: cash actually received that day (payments ledger; voids net out)
 */
export async function getDailyMoney(fromInput?: string, toInput?: string): Promise<DailyMoney[]> {
  await requireAuth();
  const { from, to } = resolveRange(fromInput, toInput);
  const { start, end } = rangeBounds(from, to);

  const [booked, collected] = await Promise.all([
    db
      .select({ day: shopDay(orders.createdAt), total: sql<string>`sum(${orders.totalAmount})` })
      .from(orders)
      .where(and(isNull(orders.deletedAt), gte(orders.createdAt, start), lt(orders.createdAt, end)))
      .groupBy(shopDay(orders.createdAt)),
    db
      .select({ day: shopDay(payments.createdAt), total: sql<string>`sum(${payments.amount})` })
      .from(payments)
      .innerJoin(orders, eq(orders.id, payments.orderId))
      .where(and(isNull(orders.deletedAt), gte(payments.createdAt, start), lt(payments.createdAt, end)))
      .groupBy(shopDay(payments.createdAt)),
  ]);

  const b = new Map(booked.map((r) => [r.day, toNumber(r.total)]));
  const c = new Map(collected.map((r) => [r.day, toNumber(r.total)]));
  return eachDay(from, to).map((date) => ({
    date,
    booked: roundMoney(b.get(date) ?? 0),
    collected: roundMoney(c.get(date) ?? 0),
  }));
}

/** Everything the date-range report shows. */
export async function getRangeReport(fromInput?: string, toInput?: string) {
  await requireAuth();
  const range = resolveRange(fromInput, toInput);
  const { start, end } = rangeBounds(range.from, range.to);

  const [daily, ledger, booked, completed] = await Promise.all([
    getDailyMoney(range.from, range.to),
    db
      .select({
        amount: payments.amount,
        method: payments.method,
        receivedByName: profiles.fullName,
        customerId: customers.id,
        customerName: customers.name,
      })
      .from(payments)
      .innerJoin(orders, eq(orders.id, payments.orderId))
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .leftJoin(profiles, eq(profiles.id, payments.receivedBy))
      .where(and(isNull(orders.deletedAt), gte(payments.createdAt, start), lt(payments.createdAt, end))),
    db
      .select({ n: sql<number>`count(*)::int`, total: sql<string>`coalesce(sum(${orders.totalAmount}), 0)` })
      .from(orders)
      .where(and(isNull(orders.deletedAt), gte(orders.createdAt, start), lt(orders.createdAt, end))),
    db
      .select({ n: sql<number>`count(DISTINCT ${orderEvents.orderId})::int` })
      .from(orderEvents)
      .innerJoin(orders, eq(orders.id, orderEvents.orderId))
      .where(
        and(
          isNull(orders.deletedAt),
          eq(orderEvents.type, "status"),
          like(orderEvents.message, "%to Completed%"),
          gte(orderEvents.createdAt, start),
          lt(orderEvents.createdAt, end),
        ),
      ),
  ]);

  const sumBy = <K extends string>(key: (r: (typeof ledger)[number]) => K) => {
    const m = new Map<K, number>();
    for (const r of ledger) m.set(key(r), (m.get(key(r)) ?? 0) + toNumber(r.amount));
    return [...m]
      .map(([name, amount]) => ({ name, amount: roundMoney(amount) }))
      .filter((x) => Math.abs(x.amount) > 0.009)
      .sort((a, b) => b.amount - a.amount);
  };

  const collected = roundMoney(ledger.reduce((s, r) => s + toNumber(r.amount), 0));
  const topCustomers = (() => {
    const m = new Map<string, { id: string; name: string; amount: number }>();
    for (const r of ledger) {
      const cur = m.get(r.customerId) ?? { id: r.customerId, name: r.customerName, amount: 0 };
      cur.amount += toNumber(r.amount);
      m.set(r.customerId, cur);
    }
    return [...m.values()]
      .map((c) => ({ ...c, amount: roundMoney(c.amount) }))
      .filter((c) => c.amount > 0.009)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  })();

  return {
    ...range,
    daily,
    collected,
    paymentCount: ledger.filter((r) => toNumber(r.amount) > 0).length,
    booked: roundMoney(toNumber(booked[0]?.total)),
    orderCount: Number(booked[0]?.n) || 0,
    completedCount: Number(completed[0]?.n) || 0,
    byMethod: sumBy((r) => r.method),
    byStaff: sumBy((r) => r.receivedByName ?? "Unknown staff"),
    topCustomers,
  };
}

export type Receivable = {
  id: string;
  orderNumber: number;
  title: string;
  status: string;
  totalAmount: string;
  depositAmount: string;
  balance: number;
  createdAt: Date;
  dueDate: Date | null;
  ageDays: number;
  customerId: string;
  customerName: string;
  contactNumber: string | null;
  lastPaymentAt: Date | null;
};

/** Every live order with money still owed, oldest first. */
export async function getReceivables(): Promise<Receivable[]> {
  await requireAuth();
  const lastPayment = db
    .select({ orderId: payments.orderId, at: sql<Date>`max(${payments.createdAt})`.as("at") })
    .from(payments)
    .groupBy(payments.orderId)
    .as("last_payment");

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      title: orders.title,
      status: orders.status,
      totalAmount: orders.totalAmount,
      depositAmount: orders.depositAmount,
      createdAt: orders.createdAt,
      dueDate: orders.dueDate,
      customerId: customers.id,
      customerName: customers.name,
      contactNumber: customers.contactNumber,
      lastPaymentAt: lastPayment.at,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .leftJoin(lastPayment, eq(lastPayment.orderId, orders.id))
    .where(and(isNull(orders.deletedAt), sql`${orders.totalAmount} - ${orders.depositAmount} > 0.009`))
    .orderBy(asc(orders.createdAt));

  const now = new Date();
  return rows.map((r) => ({
    ...r,
    balance: roundMoney(toNumber(r.totalAmount) - toNumber(r.depositAmount)),
    ageDays: Math.max(0, -daysUntil(r.createdAt, now)),
    lastPaymentAt: r.lastPaymentAt ? new Date(r.lastPaymentAt) : null,
  }));
}
