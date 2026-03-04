"use server";

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin } from "@/lib/auth";
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
    with: {
      customer: true,
      items: true,
    },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });
}

export async function getOrder(orderId: string) {
  await requireAuth();
  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) return null;

  return db.query.orders.findFirst({
    where: eq(orders.id, parsed.data),
    with: {
      customer: true,
      items: true,
    },
  });
}

export async function getOrderStats() {
  await requireAuth();
  const allOrders = await db.query.orders.findMany({
    with: { customer: true },
  });

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);

  const activeOrders = allOrders.filter((o) => o.status !== "Completed");

  const dueToday = allOrders.filter(
    (o) =>
      o.dueDate &&
      new Date(o.dueDate) >= todayStart &&
      new Date(o.dueDate) < todayEnd &&
      o.status !== "Completed",
  );

  const overdueOrders = allOrders.filter(
    (o) =>
      o.dueDate &&
      new Date(o.dueDate) < now &&
      o.status !== "Completed",
  );

  const readyForPickup = allOrders.filter(
    (o) => o.status === "Ready for Pickup",
  );

  const pendingRevenue = activeOrders.reduce(
    (sum, o) =>
      sum + (parseFloat(o.totalAmount) - parseFloat(o.depositAmount)),
    0,
  );

  return {
    activeOrders: activeOrders.length,
    dueToday: dueToday.length,
    overdueOrders: overdueOrders.length,
    readyForPickup: readyForPickup.length,
    pendingRevenue,
    totalOrders: allOrders.length,
  };
}

export async function getRecentOrders(limit = 5) {
  await requireAuth();
  return db.query.orders.findMany({
    with: {
      customer: true,
      items: true,
    },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    limit,
  });
}

export async function createOrder(data: OrderFormValues) {
  await requireAuth();
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid order data", data: null };
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
  await requireAuth();
  const parsed = updateOrderStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid status update" };
  }

  await db
    .update(orders)
    .set({ status: parsed.data.status })
    .where(eq(orders.id, parsed.data.orderId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  return { success: true };
}

export async function updateOrder(
  orderId: string,
  data: OrderFormValues,
) {
  await requireAuth();
  const idParsed = z.string().uuid().safeParse(orderId);
  if (!idParsed.success) return { error: "Invalid order ID", data: null };

  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid order data", data: null };

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
      })
      .where(eq(orders.id, idParsed.data))
      .returning();

    // Delete old items and insert new ones
    await tx.delete(orderItems).where(eq(orderItems.orderId, idParsed.data));

    if (items.length > 0) {
      await tx.insert(orderItems).values(
        items.map((item) => ({
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
  } catch (e) {
    return { error: "Unauthorized: Admin access required to delete orders." };
  }

  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) {
    return { error: "Invalid order ID" };
  }

  await db.delete(orders).where(eq(orders.id, parsed.data));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/orders");
  return { success: true };
}
