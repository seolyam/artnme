import { and, asc, eq, gte, isNull, lt } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { db } from "@/db";
import { customers, orders, payments, profiles } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { getReceivables } from "@/app/actions/reports";
import { toNumber } from "@/lib/money";
import { rangeBounds, resolveRange } from "@/lib/report-range";
import { shopToday, toShopInputValue } from "@/lib/time";

export const dynamic = "force-dynamic";

type Cell = string | number | null | undefined;

/** RFC 4180 quoting, plus a guard so spreadsheet apps never run a cell as a formula. */
function cell(value: Cell) {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(header: string[], rows: Cell[][]) {
  // BOM so Excel opens ₱ and accented names correctly.
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

const shopDate = (d: Date | null) => (d ? toShopInputValue(d).slice(0, 10) : "");
const shopTime = (d: Date) => toShopInputValue(d).slice(11, 16);
const money = (v: string | number) => toNumber(v).toFixed(2);

/** CSV exports for the reports pages. Signed-in staff only. */
export async function GET(request: NextRequest) {
  await requireAuth();
  const sp = request.nextUrl.searchParams;
  const type = sp.get("type");
  const { from, to } = resolveRange(sp.get("from"), sp.get("to"));
  const { start, end } = rangeBounds(from, to);
  let csv: string;
  let name: string;

  if (type === "payments") {
    const rows = await db
      .select({
        createdAt: payments.createdAt,
        orderNumber: orders.orderNumber,
        title: orders.title,
        customer: customers.name,
        method: payments.method,
        reference: payments.reference,
        amount: payments.amount,
        by: profiles.fullName,
        note: payments.note,
        voids: payments.voidsPaymentId,
      })
      .from(payments)
      .innerJoin(orders, eq(orders.id, payments.orderId))
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .leftJoin(profiles, eq(profiles.id, payments.receivedBy))
      .where(and(isNull(orders.deletedAt), gte(payments.createdAt, start), lt(payments.createdAt, end)))
      .orderBy(asc(payments.createdAt));
    csv = toCsv(
      ["Date", "Time", "Order #", "Order", "Customer", "Method", "Reference", "Amount", "Received by", "Note", "Type"],
      rows.map((r) => [
        shopDate(r.createdAt),
        shopTime(r.createdAt),
        r.orderNumber,
        r.title,
        r.customer,
        r.method,
        r.reference,
        money(r.amount),
        r.by,
        r.note,
        r.voids ? "Void" : r.method === "Adjustment" ? "Adjustment" : "Payment",
      ]),
    );
    name = `payments-${from}-to-${to}`;
  } else if (type === "orders") {
    const rows = await db
      .select({
        createdAt: orders.createdAt,
        orderNumber: orders.orderNumber,
        title: orders.title,
        customer: customers.name,
        status: orders.status,
        total: orders.totalAmount,
        paid: orders.depositAmount,
        dueDate: orders.dueDate,
      })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(and(isNull(orders.deletedAt), gte(orders.createdAt, start), lt(orders.createdAt, end)))
      .orderBy(asc(orders.createdAt));
    csv = toCsv(
      ["Ordered", "Order #", "Order", "Customer", "Status", "Total", "Paid", "Balance", "Due"],
      rows.map((r) => [
        shopDate(r.createdAt),
        r.orderNumber,
        r.title,
        r.customer,
        r.status,
        money(r.total),
        money(r.paid),
        (toNumber(r.total) - toNumber(r.paid)).toFixed(2),
        shopDate(r.dueDate),
      ]),
    );
    name = `orders-${from}-to-${to}`;
  } else if (type === "receivables") {
    const rows = await getReceivables();
    csv = toCsv(
      ["Order #", "Order", "Customer", "Contact", "Status", "Ordered", "Age (days)", "Due", "Total", "Paid", "Balance", "Last payment"],
      rows.map((r) => [
        r.orderNumber,
        r.title,
        r.customerName,
        r.contactNumber,
        r.status,
        shopDate(r.createdAt),
        r.ageDays,
        shopDate(r.dueDate),
        money(r.totalAmount),
        money(r.depositAmount),
        r.balance.toFixed(2),
        shopDate(r.lastPaymentAt),
      ]),
    );
    name = `unpaid-balances-${shopToday()}`;
  } else {
    return new Response("Unknown report type", { status: 400 });
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="artnme-${name}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
