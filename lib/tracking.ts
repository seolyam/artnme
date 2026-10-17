import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { customers, orderFiles, orderItems, orders } from "@/db/schema";
import { WEB_QUOTE_PREFIX } from "@/lib/validators";

const TOKEN = /^[0-9a-f]{32}$/;

/**
 * What a customer may see about their order on the public tracking page.
 * Deliberately narrow: no notes, staff names, contact details or item
 * descriptions — only status, dates, money and what's being made.
 */
export async function getTrackedOrder(token: string) {
  if (!TOKEN.test(token)) return null;

  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      title: orders.title,
      status: orders.status,
      totalAmount: orders.totalAmount,
      depositAmount: orders.depositAmount,
      dueDate: orders.dueDate,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      customerName: customers.name,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(and(eq(orders.trackingToken, token), isNull(orders.deletedAt)));
  if (!order) return null;

  const [items, proofs] = await Promise.all([
    db
      .select({ productType: orderItems.productType, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id)),
    db
      .select({ approvedAt: orderFiles.approvedAt })
      .from(orderFiles)
      .where(and(eq(orderFiles.orderId, order.id), eq(orderFiles.kind, "proof"))),
  ]);

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    depositAmount: order.depositAmount,
    dueDate: order.dueDate,
    createdAt: order.createdAt,
    title: order.title.startsWith(WEB_QUOTE_PREFIX) ? order.title.replace(/^Web quote\s*[—-]\s*/, "") : order.title,
    firstName: order.customerName.split(/\s+/)[0] || "there",
    items,
    proofCount: proofs.length,
    proofApproved: proofs.some((p) => p.approvedAt),
  };
}
