"use server";

import { db } from "@/db";
import { orders, orderItems, profiles } from "@/db/schema";
import { eq, isNull, sql, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin, getSessionProfile } from "@/lib/auth";
import {
  orderSchema,
  updateOrderStatusSchema,
  type OrderFormValues,
  type UpdateOrderStatusValues,
} from "@/lib/validators";
import { z } from "zod/v4";

export async function getOrders() {
  await requireAuth();
  return db.query.orders.findMany({
    where: isNull(orders.deletedAt),
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

  // Always resolve to the canonical UUID via raw SQL — robust against the
  // drizzle client having a stale schema after the `order_number` migration
  // (avoids any reliance on `orders.orderNumber` being defined on the
  // currently-loaded schema object).
  let orderId: string | null = null;

  if (asUuid.success) {
    orderId = asUuid.data;
  } else if (asNumber.success) {
    const rows = (await db.execute(sql`
      SELECT id FROM orders
      WHERE order_number = ${asNumber.data}
        AND deleted_at IS NULL
      LIMIT 1
    `)) as unknown as Array<{ id: string }>;
    orderId = rows[0]?.id ?? null;
  } else {
    return null;
  }

  if (!orderId) return null;

  return db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), isNull(orders.deletedAt)),
    with: { customer: true, items: true },
  });
}

export async function getOrderStats() {
  await requireAuth();

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);

  const nowIso = now.toISOString();
  const todayStartIso = todayStart.toISOString();
  const todayEndIso = todayEnd.toISOString();

  const rows = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      activeOrders: sql<number>`count(*) FILTER (WHERE ${orders.status} <> 'Completed')::int`,
      dueToday: sql<number>`count(*) FILTER (WHERE ${orders.dueDate} IS NOT NULL AND ${orders.dueDate} >= ${todayStartIso}::timestamptz AND ${orders.dueDate} < ${todayEndIso}::timestamptz AND ${orders.status} <> 'Completed')::int`,
      overdueOrders: sql<number>`count(*) FILTER (WHERE ${orders.dueDate} IS NOT NULL AND ${orders.dueDate} < ${nowIso}::timestamptz AND ${orders.status} <> 'Completed')::int`,
      readyForPickup: sql<number>`count(*) FILTER (WHERE ${orders.status} = 'Ready for Pickup')::int`,
      pendingRevenue: sql<number>`coalesce(sum(${orders.totalAmount}::numeric) FILTER (WHERE ${orders.status} <> 'Completed'), 0) - coalesce(sum(${orders.depositAmount}::numeric) FILTER (WHERE ${orders.status} <> 'Completed'), 0)`,
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

export async function createOrder(data: OrderFormValues) {
  const { user } = await getSessionProfile();
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: "Invalid order data",
      fieldErrors: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
      data: null,
    };
  }

  const { items, ...orderData } = parsed.data;

  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        customerId: orderData.customerId,
        title: orderData.title,
        status: orderData.status,
        totalAmount: orderData.totalAmount.toString(),
        depositAmount: orderData.depositAmount.toString(),
        dueDate: orderData.dueDate ? new Date(orderData.dueDate) : null,
        createdBy: user.id,
        updatedBy: user.id,
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

    return order;
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  return { error: null, data: result };
}

export async function updateOrderStatus(data: UpdateOrderStatusValues) {
  const { user } = await getSessionProfile();
  const parsed = updateOrderStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid status update" };
  }

  await db
    .update(orders)
    .set({
      status: parsed.data.status,
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, parsed.data.orderId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
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
      fieldErrors: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
      data: null,
    };
  }

  const { items, ...orderData } = parsed.data;

  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(orders)
      .set({
        customerId: orderData.customerId,
        title: orderData.title,
        status: orderData.status,
        totalAmount: orderData.totalAmount.toString(),
        depositAmount: orderData.depositAmount.toString(),
        dueDate: orderData.dueDate ? new Date(orderData.dueDate) : null,
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

    // Items in payload that have an id matching an existing item -> UPDATE
    const incomingById = new Map(
      items
        .filter((it) => "id" in it && typeof (it as { id?: unknown }).id === "string")
        .map((it) => [(it as { id: string }).id, it]),
    );

    const toDelete = existingItems.filter((e) => !incomingById.has(e.id));
    const toInsert = items.filter(
      (it) => !("id" in it) || typeof (it as { id?: unknown }).id !== "string",
    );
    const toUpdate = items.filter((it) => {
      const id = (it as { id?: unknown }).id;
      return typeof id === "string" && existingItems.some((e) => e.id === id);
    });

    if (toDelete.length > 0) {
      await tx
        .delete(orderItems)
        .where(
          sql`${orderItems.id} IN (${sql.join(
            toDelete.map((d) => d.id),
            sql`,`,
          )})`,
        );
    }

    for (const it of toUpdate) {
      const id = (it as { id: string }).id;
      await tx
        .update(orderItems)
        .set({
          productType: it.productType,
          description: it.description || null,
          quantity: it.quantity,
          dimensions: it.dimensions || null,
          unitPrice: it.unitPrice.toString(),
        })
        .where(eq(orderItems.id, id));
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

    return updated;
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  return { error: null, data: result };
}

export async function deleteOrder(orderId: string) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized: Admin access required to delete orders." };
  }

  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) {
    return { error: "Invalid order ID" };
  }

  // Soft-delete: preserve financial history.
  await db
    .update(orders)
    .set({ deletedAt: new Date() })
    .where(eq(orders.id, parsed.data));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
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
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized: Admin access required to restore orders." };
  }

  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) {
    return { error: "Invalid order ID" };
  }

  await db
    .update(orders)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(orders.id, parsed.data));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
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

  await db.delete(orders).where(eq(orders.id, parsed.data));

  revalidatePath("/dashboard/orders/trash");
  return { success: true };
}

export async function getOrderActorProfile(userId: string | null) {
  if (!userId) return null;
  const parsed = z.string().uuid().safeParse(userId);
  if (!parsed.success) return null;
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, parsed.data),
  });
  return profile;
}

export async function recordDeposit(orderId: string, amount: number) {
  const { user } = await getSessionProfile();
  const idParsed = z.string().uuid().safeParse(orderId);
  if (!idParsed.success) return { error: "Invalid order ID" };

  const amountParsed = z.coerce
    .number()
    .min(0.01, "Payment must be greater than 0")
    .safeParse(amount);
  if (!amountParsed.success) {
    return { error: amountParsed.error.issues[0]?.message ?? "Invalid amount" };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .select({
          deposit: orders.depositAmount,
          total: orders.totalAmount,
        })
        .from(orders)
        .where(eq(orders.id, idParsed.data))
        .limit(1);

      if (!order) throw new Error("Order not found");

      const currentDeposit = parseFloat(order.deposit);
      const total = parseFloat(order.total);
      const newDeposit = currentDeposit + amountParsed.data;

      if (newDeposit > total + 0.01) {
        throw new Error(
          `Payment exceeds order total (₱${total.toLocaleString()})`,
        );
      }

      await tx
        .update(orders)
        .set({
          depositAmount: newDeposit.toFixed(2),
          updatedBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, idParsed.data));

      return { newDeposit, total };
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath(`/dashboard/customers`);
    return { success: true, ...result };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to record payment",
    };
  }
}
