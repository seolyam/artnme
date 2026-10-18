"use server";

import { db } from "@/db";
import {
  orders,
  orderItems,
  profiles,
  payments,
  orderEvents,
  customers,
  type OrderStatus,
} from "@/db/schema";
import { eq, isNull, isNotNull, sql, and, desc, like, inArray, gte, lt, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin, getSessionProfile } from "@/lib/auth";
import {
  orderSchema,
  updateOrderStatusSchema,
  paymentSchema,
  orderNoteSchema,
  type OrderFormValues,
  type UpdateOrderStatusValues,
  type PaymentValues,
  WEB_QUOTE_PREFIX,
} from "@/lib/validators";
import { logOrderEvent } from "@/lib/order-events";
import { BOARD_ARCHIVE_DAYS } from "@/lib/order-status";
import { peso, roundMoney, toNumber } from "@/lib/money";
import { formatShopDate, parseShopDateTime, shopDayRange, shopToday } from "@/lib/time";
import { z } from "zod/v4";

/** A web quote nobody has touched for this long is flagged as stale. */
const STALE_QUOTE_HOURS = 24;
/** "Due soon" horizon for the action queue. */
const DUE_SOON_DAYS = 3;

function revalidateOrder(orderNumber?: number | string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/reports");
  if (orderNumber !== undefined) revalidatePath(`/dashboard/orders/${orderNumber}`);
}

function fieldErrorsOf(error: z.ZodError) {
  return error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}

export async function getOrders() {
  await requireAuth();
  return db.query.orders.findMany({
    where: and(
      isNull(orders.deletedAt),
      sql`(${orders.status} <> 'Completed' OR coalesce(${orders.updatedAt}, ${orders.createdAt}) >= now() - make_interval(days => ${BOARD_ARCHIVE_DAYS}))`,
    ),
    with: {
      customer: true,
      items: true,
    },
    orderBy: [desc(orders.createdAt)],
  });
}

export async function getOrder(orderIdOrNumber: string) {
  await requireAuth();

  // Accept either a UUID (legacy bookmarks) or a clean integer order number.
  const asUuid = z.string().uuid().safeParse(orderIdOrNumber);
  const asNumber = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(orderIdOrNumber);

  let where;
  if (asUuid.success) {
    where = eq(orders.id, asUuid.data);
  } else if (asNumber.success) {
    where = eq(orders.orderNumber, asNumber.data);
  } else {
    return null;
  }

  const order = await db.query.orders.findFirst({
    where: and(where, isNull(orders.deletedAt)),
    with: { customer: true, items: true },
  });
  return order ?? null;
}

export async function getOrderStats() {
  await requireAuth();

  const { start: todayStart, end: todayEnd } = shopDayRange(shopToday());
  const now = new Date();

  const rows = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      activeOrders: sql<number>`count(*) FILTER (WHERE ${orders.status} <> 'Completed')::int`,
      dueToday: sql<number>`count(*) FILTER (WHERE ${orders.dueDate} >= ${todayStart.toISOString()}::timestamptz AND ${orders.dueDate} < ${todayEnd.toISOString()}::timestamptz AND ${orders.status} <> 'Completed')::int`,
      overdueOrders: sql<number>`count(*) FILTER (WHERE ${orders.dueDate} < ${now.toISOString()}::timestamptz AND ${orders.status} <> 'Completed')::int`,
      readyForPickup: sql<number>`count(*) FILTER (WHERE ${orders.status} = 'Ready for Pickup')::int`,
      // Every unpaid balance, including jobs released without full payment;
      // matches the receivables report.
      pendingRevenue: sql<number>`coalesce(sum(greatest(${orders.totalAmount} - ${orders.depositAmount}, 0)), 0)`,
    })
    .from(orders)
    .where(isNull(orders.deletedAt));

  const r = rows[0];
  return {
    activeOrders: Number(r.activeOrders) || 0,
    dueToday: Number(r.dueToday) || 0,
    overdueOrders: Number(r.overdueOrders) || 0,
    readyForPickup: Number(r.readyForPickup) || 0,
    pendingRevenue: Number(r.pendingRevenue) || 0,
    totalOrders: Number(r.totalOrders) || 0,
  };
}

/** Web quotes still waiting in Pending — surfaced as a badge for staff. */
export async function getWebQuoteCount() {
  await requireAuth();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        isNull(orders.deletedAt),
        eq(orders.status, "Pending"),
        like(orders.title, `${WEB_QUOTE_PREFIX}%`),
      ),
    );
  return Number(row?.n) || 0;
}

export async function getRecentOrders(limit = 5) {
  await requireAuth();
  return db.query.orders.findMany({
    where: isNull(orders.deletedAt),
    with: {
      customer: true,
      items: true,
    },
    orderBy: [desc(orders.createdAt)],
    limit,
  });
}

// ─── Action queue ───────────────────────────────────────────────────────────

export type QueueOrder = {
  id: string;
  orderNumber: number;
  title: string;
  status: string;
  customerName: string;
  dueDate: Date | null;
  totalAmount: string;
  depositAmount: string;
  assignedTo: string | null;
  createdAt: Date;
};

/**
 * Everything that needs a human today, bucketed so the dashboard can show one
 * prioritized list. A single query; bucketing happens on the small result set.
 */
export async function getWorkQueue() {
  const user = await requireAuth();
  const now = new Date();
  const { end: todayEnd } = shopDayRange(shopToday());
  const soonEnd = new Date(todayEnd.getTime() + (DUE_SOON_DAYS - 1) * 86_400_000);
  const staleBefore = new Date(now.getTime() - STALE_QUOTE_HOURS * 3_600_000);

  const rows: QueueOrder[] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      title: orders.title,
      status: orders.status,
      customerName: customers.name,
      dueDate: orders.dueDate,
      totalAmount: orders.totalAmount,
      depositAmount: orders.depositAmount,
      assignedTo: orders.assignedTo,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(and(isNull(orders.deletedAt), sql`${orders.status} <> 'Completed'`))
    .orderBy(asc(sql`coalesce(${orders.dueDate}, 'infinity'::timestamptz)`), asc(orders.createdAt));

  const overdue: QueueOrder[] = [];
  const dueToday: QueueOrder[] = [];
  const dueSoon: QueueOrder[] = [];
  const readyUnpaid: QueueOrder[] = [];
  const staleQuotes: QueueOrder[] = [];
  const unpriced: QueueOrder[] = [];

  for (const o of rows) {
    const due = o.dueDate ? new Date(o.dueDate) : null;
    if (due && due < now) overdue.push(o);
    else if (due && due < todayEnd) dueToday.push(o);
    else if (due && due < soonEnd) dueSoon.push(o);

    const balance = toNumber(o.totalAmount) - toNumber(o.depositAmount);
    if (o.status === "Ready for Pickup" && balance > 0.009) readyUnpaid.push(o);
    if (
      o.status === "Pending" &&
      o.title.startsWith(WEB_QUOTE_PREFIX) &&
      new Date(o.createdAt) < staleBefore
    ) {
      staleQuotes.push(o);
    }
    if (o.status !== "Pending" && toNumber(o.totalAmount) <= 0) unpriced.push(o);
  }

  return {
    overdue,
    dueToday,
    dueSoon,
    readyUnpaid,
    staleQuotes,
    unpriced,
    mine: rows.filter((o) => o.assignedTo === user.id).length,
    unassigned: rows.filter((o) => !o.assignedTo).length,
  };
}

// ─── Create / update ────────────────────────────────────────────────────────

export async function createOrder(data: OrderFormValues) {
  const { user } = await getSessionProfile();
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: "Invalid order data",
      fieldErrors: fieldErrorsOf(parsed.error),
      data: null,
    };
  }

  const { items, depositMethod, ...orderData } = parsed.data;
  const total = roundMoney(orderData.totalAmount);
  const deposit = roundMoney(orderData.depositAmount);
  if (deposit > total + 0.009) {
    return {
      error: "Deposit is more than the order total",
      fieldErrors: [{ path: "depositAmount", message: "Deposit can't exceed the total" }],
      data: null,
    };
  }

  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        customerId: orderData.customerId,
        title: orderData.title,
        status: orderData.status,
        totalAmount: total.toFixed(2),
        depositAmount: deposit.toFixed(2),
        dueDate: parseShopDateTime(orderData.dueDate),
        createdBy: user.id,
        updatedBy: user.id,
        // Whoever takes the order owns it until someone reassigns it.
        assignedTo: user.id,
        updatedAt: new Date(),
      })
      .returning();

    if (items.length > 0) {
      await tx.insert(orderItems).values(
        items.map((item) => ({
          orderId: order.id,
          productType: item.productType,
          description: item.description || null,
          quantity: item.quantity,
          dimensions: item.dimensions || null,
          unitPrice: item.unitPrice.toString(),
        })),
      );
    }

    await logOrderEvent(tx, {
      orderId: order.id,
      type: "created",
      message: "Order created",
      actorId: user.id,
    });

    if (deposit > 0) {
      await tx.insert(payments).values({
        orderId: order.id,
        amount: deposit.toFixed(2),
        method: depositMethod ?? "Cash",
        note: "Deposit taken with the order",
        receivedBy: user.id,
      });
      await logOrderEvent(tx, {
        orderId: order.id,
        type: "payment",
        message: `Received ${peso(deposit)} deposit (${depositMethod ?? "Cash"})`,
        actorId: user.id,
      });
    }

    return order;
  });

  revalidateOrder();
  return { error: null, data: result };
}

export async function updateOrderStatus(data: UpdateOrderStatusValues) {
  const { user } = await getSessionProfile();
  const parsed = updateOrderStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid status update" };
  }

  const result = await db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        status: orders.status,
        orderNumber: orders.orderNumber,
        assignedTo: orders.assignedTo,
        totalAmount: orders.totalAmount,
        depositAmount: orders.depositAmount,
      })
      .from(orders)
      .where(and(eq(orders.id, parsed.data.orderId), isNull(orders.deletedAt)))
      .for("update");

    if (!current) return { error: "Order not found" } as const;
    if (current.status === parsed.data.status) return { orderNumber: current.orderNumber } as const;

    // Picking a job up out of Pending claims it when nobody owns it yet.
    const claim = !current.assignedTo && current.status === "Pending";

    await tx
      .update(orders)
      .set({
        status: parsed.data.status,
        updatedBy: user.id,
        updatedAt: new Date(),
        ...(claim ? { assignedTo: user.id } : {}),
      })
      .where(eq(orders.id, parsed.data.orderId));

    const balance = toNumber(current.totalAmount) - toNumber(current.depositAmount);
    const suffix =
      parsed.data.status === "Completed" && balance > 0.009
        ? ` with ${peso(balance)} still unpaid`
        : "";
    await logOrderEvent(tx, {
      orderId: parsed.data.orderId,
      type: "status",
      message: `Moved from ${current.status} to ${parsed.data.status}${suffix}`,
      actorId: user.id,
    });
    if (claim) {
      await logOrderEvent(tx, {
        orderId: parsed.data.orderId,
        type: "assigned",
        message: "Picked up the job",
        actorId: user.id,
      });
    }

    return { orderNumber: current.orderNumber } as const;
  });

  if ("error" in result) return { error: result.error };
  revalidateOrder(result.orderNumber);
  return { success: true };
}

export async function updateOrder(
  orderId: string,
  data: OrderFormValues,
) {
  const { user } = await getSessionProfile();
  const idParsed = z.string().uuid().safeParse(orderId);
  if (!idParsed.success) return { error: "Invalid order ID", data: null };

  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: "Invalid order data",
      fieldErrors: fieldErrorsOf(parsed.error),
      data: null,
    };
  }

  // depositMethod only applies at creation; later money goes through the ledger.
  const { items, ...orderData } = parsed.data;
  const total = roundMoney(orderData.totalAmount);
  const deposit = roundMoney(orderData.depositAmount);
  if (deposit > total + 0.009) {
    return {
      error: "Amount paid is more than the order total",
      fieldErrors: [{ path: "depositAmount", message: "Paid can't exceed the total" }],
      data: null,
    };
  }

  const result = await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, idParsed.data))
      .for("update");
    if (!before) return null;

    const dueDate = parseShopDateTime(orderData.dueDate);

    const [updated] = await tx
      .update(orders)
      .set({
        customerId: orderData.customerId,
        title: orderData.title,
        status: orderData.status,
        totalAmount: total.toFixed(2),
        depositAmount: deposit.toFixed(2),
        dueDate,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, idParsed.data))
      .returning();

    // Preserve existing item IDs via diff/upsert.
    const existingItems = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, idParsed.data));

    const incomingIds = new Set(items.map((it) => it.id).filter(Boolean));
    const existingIds = new Set(existingItems.map((e) => e.id));

    const toDelete = existingItems.filter((e) => !incomingIds.has(e.id));
    const toInsert = items.filter((it) => !it.id || !existingIds.has(it.id));
    const existingById = new Map(existingItems.map((e) => [e.id, e]));
    const toUpdate = items.filter((it) => {
      const e = it.id ? existingById.get(it.id) : undefined;
      if (!e) return false;
      return (
        e.productType !== it.productType ||
        (e.description ?? "") !== (it.description ?? "") ||
        e.quantity !== it.quantity ||
        (e.dimensions ?? "") !== (it.dimensions ?? "") ||
        toNumber(e.unitPrice) !== it.unitPrice
      );
    });

    if (toDelete.length > 0) {
      await tx.delete(orderItems).where(
        inArray(
          orderItems.id,
          toDelete.map((d) => d.id),
        ),
      );
    }

    for (const it of toUpdate) {
      await tx
        .update(orderItems)
        .set({
          productType: it.productType,
          description: it.description || null,
          quantity: it.quantity,
          dimensions: it.dimensions || null,
          unitPrice: it.unitPrice.toString(),
        })
        .where(eq(orderItems.id, it.id!));
    }

    if (toInsert.length > 0) {
      await tx.insert(orderItems).values(
        toInsert.map((item) => ({
          orderId: idParsed.data,
          productType: item.productType,
          description: item.description || null,
          quantity: item.quantity,
          dimensions: item.dimensions || null,
          unitPrice: item.unitPrice.toString(),
        })),
      );
    }

    // Keep the ledger summing to deposit_amount: a hand-edited "paid" figure
    // becomes an adjustment entry rather than silently rewriting history.
    const paidDelta = roundMoney(deposit - toNumber(before.depositAmount));
    if (Math.abs(paidDelta) >= 0.01) {
      await tx.insert(payments).values({
        orderId: idParsed.data,
        amount: paidDelta.toFixed(2),
        method: "Adjustment",
        note: "Changed in the order edit form",
        receivedBy: user.id,
      });
    }

    const changes: string[] = [];
    if (before.title !== orderData.title) changes.push("title");
    if (before.customerId !== orderData.customerId) changes.push("customer");
    if ((before.dueDate?.getTime() ?? null) !== (dueDate?.getTime() ?? null)) changes.push("due date");
    if (toNumber(before.totalAmount) !== total) changes.push(`total (${peso(before.totalAmount)} → ${peso(total)})`);
    if (Math.abs(paidDelta) >= 0.01) changes.push(`amount paid (${paidDelta > 0 ? "+" : "−"}${peso(Math.abs(paidDelta))})`);
    if (toDelete.length || toInsert.length || toUpdate.length) changes.push("items");

    if (changes.length > 0) {
      await logOrderEvent(tx, {
        orderId: idParsed.data,
        type: "edit",
        message: `Edited ${changes.join(", ")}`,
        actorId: user.id,
      });
    }
    if (before.status !== orderData.status) {
      await logOrderEvent(tx, {
        orderId: idParsed.data,
        type: "status",
        message: `Moved from ${before.status} to ${orderData.status}`,
        actorId: user.id,
      });
    }

    return updated;
  });

  if (!result) return { error: "Order not found", data: null };

  revalidateOrder(result.orderNumber);
  return { error: null, data: result };
}

// ─── Trash ──────────────────────────────────────────────────────────────────

export async function deleteOrder(orderId: string) {
  let actorId: string;
  try {
    actorId = (await requireAdmin()).user.id;
  } catch {
    return { error: "Unauthorized: Admin access required to delete orders." };
  }

  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) {
    return { error: "Invalid order ID" };
  }

  // Soft-delete: preserve financial history.
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ deletedAt: new Date() })
      .where(eq(orders.id, parsed.data));
    await logOrderEvent(tx, {
      orderId: parsed.data,
      type: "deleted",
      message: "Moved to trash",
      actorId,
    });
  });

  revalidateOrder();
  revalidatePath("/dashboard/orders/trash");
  return { success: true };
}

export async function getTrashedOrders() {
  await requireAdmin();
  return db.query.orders.findMany({
    where: (o, { isNotNull }) => isNotNull(o.deletedAt),
    with: {
      customer: true,
      items: true,
    },
    orderBy: [desc(orders.deletedAt)],
  });
}

export async function restoreOrder(orderId: string) {
  let actorId: string;
  try {
    actorId = (await requireAdmin()).user.id;
  } catch {
    return { error: "Unauthorized: Admin access required to restore orders." };
  }

  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) {
    return { error: "Invalid order ID" };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(orders.id, parsed.data));
    await logOrderEvent(tx, {
      orderId: parsed.data,
      type: "restored",
      message: "Restored from trash",
      actorId,
    });
  });

  revalidateOrder();
  revalidatePath("/dashboard/orders/trash");
  return { success: true };
}

export async function permanentlyDeleteOrder(orderId: string) {
  try {
    await requireAdmin();
  } catch {
    return {
      error: "Unauthorized: Admin access required to permanently delete orders.",
    };
  }

  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) {
    return { error: "Invalid order ID" };
  }

  // Only orders already in the trash can be purged; live jobs go through
  // deleteOrder first so there is always a chance to restore them.
  const purged = await db
    .delete(orders)
    .where(and(eq(orders.id, parsed.data), isNotNull(orders.deletedAt)))
    .returning({ id: orders.id });
  if (purged.length === 0) return { error: "Order is not in the trash" };

  revalidatePath("/dashboard/orders/trash");
  return { success: true };
}

/** Permanently delete everything in the trash now instead of waiting for the daily purge. */
export async function emptyTrash() {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized: Admin access required to empty the trash." };
  }

  const purged = await db
    .delete(orders)
    .where(isNotNull(orders.deletedAt))
    .returning({ id: orders.id });

  revalidatePath("/dashboard/orders/trash");
  return { success: true, count: purged.length };
}

// ─── Payments ───────────────────────────────────────────────────────────────

export async function recordDeposit(
  orderId: string,
  amount: number,
  details: Omit<PaymentValues, "amount"> = {},
) {
  const { user } = await getSessionProfile();
  const idParsed = z.string().uuid().safeParse(orderId);
  if (!idParsed.success) return { error: "Invalid order ID" };

  const parsed = paymentSchema.safeParse({ ...details, amount });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid payment" };
  }
  const pay = parsed.data;
  const value = roundMoney(pay.amount);

  try {
    const result = await db.transaction(async (tx) => {
      // Lock the row so two cashiers can't both take the last balance.
      const [order] = await tx
        .select({
          deposit: orders.depositAmount,
          total: orders.totalAmount,
          orderNumber: orders.orderNumber,
        })
        .from(orders)
        .where(and(eq(orders.id, idParsed.data), isNull(orders.deletedAt)))
        .limit(1)
        .for("update");

      if (!order) throw new Error("Order not found");

      const total = toNumber(order.total);
      const newDeposit = roundMoney(toNumber(order.deposit) + value);

      if (newDeposit > total + 0.009) {
        throw new Error(`Payment exceeds the remaining balance (${peso(total - toNumber(order.deposit))})`);
      }

      await tx
        .update(orders)
        .set({
          depositAmount: newDeposit.toFixed(2),
          updatedBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, idParsed.data));

      await tx.insert(payments).values({
        orderId: idParsed.data,
        amount: value.toFixed(2),
        method: pay.method,
        reference: pay.reference || null,
        note: pay.note || null,
        receivedBy: user.id,
      });

      const remaining = roundMoney(total - newDeposit);
      await logOrderEvent(tx, {
        orderId: idParsed.data,
        type: "payment",
        message: `Received ${peso(value)} via ${pay.method}${
          pay.reference ? ` (ref ${pay.reference})` : ""
        } · ${remaining > 0 ? `${peso(remaining)} left` : "fully paid"}`,
        actorId: user.id,
      });

      return { newDeposit, total, orderNumber: order.orderNumber };
    });

    revalidateOrder(result.orderNumber);
    revalidatePath(`/dashboard/customers`);
    return { success: true as const, newDeposit: result.newDeposit, total: result.total };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to record payment",
    };
  }
}

/**
 * Hand-over in one step: take whatever is still owed and close the job.
 * Used from "Ready for Pickup" so staff can't release goods and forget to
 * collect.
 */
export async function settleAndComplete(
  orderId: string,
  details: { method: PaymentValues["method"]; reference?: string } = { method: "Cash" },
) {
  const { user } = await getSessionProfile();
  const idParsed = z.string().uuid().safeParse(orderId);
  if (!idParsed.success) return { error: "Invalid order ID" };
  const methodParsed = paymentSchema.shape.method.safeParse(details.method);
  if (!methodParsed.success) return { error: "Pick a payment method" };

  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .select({
        deposit: orders.depositAmount,
        total: orders.totalAmount,
        status: orders.status,
        orderNumber: orders.orderNumber,
      })
      .from(orders)
      .where(and(eq(orders.id, idParsed.data), isNull(orders.deletedAt)))
      .for("update");
    if (!order) return { error: "Order not found" } as const;
    if (order.status === "Completed") return { error: "Order is already completed" } as const;

    const balance = roundMoney(toNumber(order.total) - toNumber(order.deposit));

    if (balance > 0) {
      await tx.insert(payments).values({
        orderId: idParsed.data,
        amount: balance.toFixed(2),
        method: methodParsed.data,
        reference: details.reference?.trim() || null,
        note: "Balance collected at pickup",
        receivedBy: user.id,
      });
      await logOrderEvent(tx, {
        orderId: idParsed.data,
        type: "payment",
        message: `Collected ${peso(balance)} balance at pickup via ${methodParsed.data}`,
        actorId: user.id,
      });
    }

    await tx
      .update(orders)
      .set({
        status: "Completed",
        depositAmount: toNumber(order.total).toFixed(2),
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, idParsed.data));

    await logOrderEvent(tx, {
      orderId: idParsed.data,
      type: "status",
      message: `Released to customer · moved from ${order.status} to Completed`,
      actorId: user.id,
    });

    return { orderNumber: order.orderNumber, collected: balance } as const;
  });

  if ("error" in result) return { error: result.error };
  revalidateOrder(result.orderNumber);
  revalidatePath("/dashboard/customers");
  return { success: true as const, collected: result.collected };
}

const voidReasonSchema = z
  .string()
  .trim()
  .min(3, "Say why this payment is being voided")
  .max(200, "Keep the reason under 200 characters");

/**
 * Admin correction for a payment recorded by mistake. The original row stays;
 * an opposite entry is added (so the ledger and daily totals still add up)
 * and the order's paid total drops by the same amount.
 */
export async function voidPayment(paymentId: string, reason: string) {
  let actorId: string;
  try {
    actorId = (await requireAdmin()).user.id;
  } catch {
    return { error: "Only an admin can void a payment." };
  }
  const idParsed = z.string().uuid().safeParse(paymentId);
  if (!idParsed.success) return { error: "Invalid payment" };
  const reasonParsed = voidReasonSchema.safeParse(reason);
  if (!reasonParsed.success) return { error: reasonParsed.error.issues[0]?.message ?? "Invalid reason" };

  try {
    const result = await db.transaction(async (tx) => {
      const [original] = await tx.select().from(payments).where(eq(payments.id, idParsed.data));
      if (!original) return { error: "Payment not found" } as const;
      if (original.voidsPaymentId) return { error: "This entry is already a reversal." } as const;

      const [order] = await tx
        .select({ deposit: orders.depositAmount, total: orders.totalAmount, orderNumber: orders.orderNumber })
        .from(orders)
        .where(and(eq(orders.id, original.orderId), isNull(orders.deletedAt)))
        .for("update");
      if (!order) return { error: "Order not found" } as const;

      const [already] = await tx
        .select({ id: payments.id })
        .from(payments)
        .where(eq(payments.voidsPaymentId, original.id));
      if (already) return { error: "This payment was already voided." } as const;

      const amount = toNumber(original.amount);
      const newDeposit = roundMoney(toNumber(order.deposit) - amount);
      if (newDeposit < -0.009 || newDeposit > toNumber(order.total) + 0.009) {
        return { error: "Voiding this would make the amount paid invalid. Check the other entries first." } as const;
      }

      await tx.insert(payments).values({
        orderId: original.orderId,
        amount: (-amount).toFixed(2),
        method: original.method,
        reference: original.reference,
        note: `Voided: ${reasonParsed.data}`,
        receivedBy: actorId,
        voidsPaymentId: original.id,
      });
      await tx
        .update(orders)
        .set({ depositAmount: newDeposit.toFixed(2), updatedBy: actorId, updatedAt: new Date() })
        .where(eq(orders.id, original.orderId));
      await logOrderEvent(tx, {
        orderId: original.orderId,
        type: "payment",
        message: `Voided ${peso(Math.abs(amount))} ${original.method} payment from ${formatShopDate(original.createdAt)} · ${reasonParsed.data}`,
        actorId,
      });

      return { orderNumber: order.orderNumber } as const;
    });

    if ("error" in result) return { error: result.error };
    revalidateOrder(result.orderNumber);
    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (e) {
    // The unique index on voids_payment_id catches two admins voiding at once.
    if (e && typeof e === "object" && "code" in e && e.code === "23505") {
      return { error: "This payment was already voided." };
    }
    throw e;
  }
}

// ─── Assignment & notes ─────────────────────────────────────────────────────

export async function assignOrder(orderId: string, assigneeId: string | null) {
  const { user } = await getSessionProfile();
  const idParsed = z.string().uuid().safeParse(orderId);
  if (!idParsed.success) return { error: "Invalid order ID" };

  let assigneeName: string | null = null;
  if (assigneeId) {
    const assigneeParsed = z.string().uuid().safeParse(assigneeId);
    if (!assigneeParsed.success) return { error: "Invalid staff member" };
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, assigneeParsed.data),
    });
    if (!profile) return { error: "Staff member not found" };
    if (profile.deactivatedAt) return { error: `${profile.fullName}'s account is deactivated` };
    assigneeName = profile.fullName;
  }

  const [updated] = await db
    .update(orders)
    .set({ assignedTo: assigneeId, updatedBy: user.id, updatedAt: new Date() })
    .where(and(eq(orders.id, idParsed.data), isNull(orders.deletedAt)))
    .returning({ orderNumber: orders.orderNumber });
  if (!updated) return { error: "Order not found" };

  await logOrderEvent(db, {
    orderId: idParsed.data,
    type: "assigned",
    message: assigneeId
      ? assigneeId === user.id
        ? "Took the job"
        : `Assigned to ${assigneeName}`
      : "Unassigned",
    actorId: user.id,
  });

  revalidateOrder(updated.orderNumber);
  return { success: true };
}

export async function addOrderNote(orderId: string, text: string) {
  const { user } = await getSessionProfile();
  const idParsed = z.string().uuid().safeParse(orderId);
  if (!idParsed.success) return { error: "Invalid order ID" };
  const noteParsed = orderNoteSchema.safeParse(text);
  if (!noteParsed.success) return { error: noteParsed.error.issues[0]?.message ?? "Invalid note" };

  const [order] = await db
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(and(eq(orders.id, idParsed.data), isNull(orders.deletedAt)));
  if (!order) return { error: "Order not found" };

  await logOrderEvent(db, {
    orderId: idParsed.data,
    type: "note",
    message: noteParsed.data,
    actorId: user.id,
  });

  revalidatePath(`/dashboard/orders/${order.orderNumber}`);
  return { success: true };
}

/** Timeline + ledger for one order, with staff names resolved. */
export async function getOrderActivity(orderId: string) {
  await requireAuth();
  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) return { events: [], payments: [] };

  const [events, ledger] = await Promise.all([
    db
      .select({
        id: orderEvents.id,
        type: orderEvents.type,
        message: orderEvents.message,
        createdAt: orderEvents.createdAt,
        actorName: profiles.fullName,
      })
      .from(orderEvents)
      .leftJoin(profiles, eq(profiles.id, orderEvents.actorId))
      .where(eq(orderEvents.orderId, parsed.data))
      .orderBy(desc(orderEvents.createdAt)),
    db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        reference: payments.reference,
        note: payments.note,
        createdAt: payments.createdAt,
        receivedByName: profiles.fullName,
        voidsPaymentId: payments.voidsPaymentId,
      })
      .from(payments)
      .leftJoin(profiles, eq(profiles.id, payments.receivedBy))
      .where(eq(payments.orderId, parsed.data))
      .orderBy(desc(payments.createdAt)),
  ]);

  return { events, payments: ledger };
}

// ─── Reports ────────────────────────────────────────────────────────────────

/** Money taken on one shop day, for the dashboard tile and the daily report. */
export async function getCollections(day: string = shopToday()) {
  await requireAuth();
  const { start, end } = shopDayRange(day);

  const rows = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      note: payments.note,
      createdAt: payments.createdAt,
      receivedByName: profiles.fullName,
      orderNumber: orders.orderNumber,
      orderTitle: orders.title,
      customerName: customers.name,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .leftJoin(profiles, eq(profiles.id, payments.receivedBy))
    .where(
      and(
        gte(payments.createdAt, start),
        lt(payments.createdAt, end),
        isNull(orders.deletedAt),
      ),
    )
    .orderBy(asc(payments.createdAt));

  const byMethod = new Map<string, number>();
  const byStaff = new Map<string, number>();
  let total = 0;
  for (const r of rows) {
    const amt = toNumber(r.amount);
    total += amt;
    byMethod.set(r.method, (byMethod.get(r.method) ?? 0) + amt);
    const who = r.receivedByName ?? "Unknown staff";
    byStaff.set(who, (byStaff.get(who) ?? 0) + amt);
  }

  return {
    day,
    total: roundMoney(total),
    count: rows.length,
    byMethod: [...byMethod].map(([method, amount]) => ({ method, amount: roundMoney(amount) })),
    byStaff: [...byStaff].map(([name, amount]) => ({ name, amount: roundMoney(amount) })),
    payments: rows,
  };
}

/** Orders opened and closed on one shop day. */
export async function getDayActivity(day: string = shopToday()) {
  await requireAuth();
  const { start, end } = shopDayRange(day);

  const [created, completed] = await Promise.all([
    db
      .select({
        orderNumber: orders.orderNumber,
        title: orders.title,
        customerName: customers.name,
        totalAmount: orders.totalAmount,
        status: orders.status,
      })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(and(isNull(orders.deletedAt), gte(orders.createdAt, start), lt(orders.createdAt, end)))
      .orderBy(asc(orders.createdAt)),
    db
      .selectDistinctOn([orders.id], {
        orderNumber: orders.orderNumber,
        title: orders.title,
        customerName: customers.name,
        totalAmount: orders.totalAmount,
        depositAmount: orders.depositAmount,
      })
      .from(orderEvents)
      .innerJoin(orders, eq(orders.id, orderEvents.orderId))
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(
        and(
          isNull(orders.deletedAt),
          eq(orders.status, "Completed" satisfies OrderStatus),
          eq(orderEvents.type, "status"),
          like(orderEvents.message, "%to Completed%"),
          gte(orderEvents.createdAt, start),
          lt(orderEvents.createdAt, end),
        ),
      ),
  ]);

  return { created, completed };
}

// ─── Live updates ───────────────────────────────────────────────────────────

/**
 * A cheap "has anything changed?" probe the portal polls every 30 seconds.
 * Every change to an order writes an order_events row, so the newest event
 * time works as a version number for the whole board.
 */
export async function getLiveStatus() {
  await requireAuth();
  const [row] = await db
    .select({
      lastEvent: sql<string | null>`(SELECT max(${orderEvents.createdAt})::text FROM ${orderEvents})`,
      latestWebQuote: sql<string | null>`(SELECT max(${orders.createdAt})::text FROM ${orders} WHERE ${orders.deletedAt} IS NULL AND ${orders.title} LIKE ${`${WEB_QUOTE_PREFIX}%`})`,
      webQuotes: sql<number>`(SELECT count(*)::int FROM ${orders} WHERE ${orders.deletedAt} IS NULL AND ${orders.status} = 'Pending' AND ${orders.title} LIKE ${`${WEB_QUOTE_PREFIX}%`})`,
    })
    .from(sql`(SELECT 1) AS one`);
  return {
    lastEvent: row?.lastEvent ?? null,
    latestWebQuote: row?.latestWebQuote ?? null,
    webQuotes: Number(row?.webQuotes) || 0,
  };
}
