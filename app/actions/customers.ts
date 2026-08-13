"use server";

import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { eq, count, isNull, sql, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { customerSchema, type CustomerFormValues } from "@/lib/validators";
import { z } from "zod/v4";

export async function getCustomers() {
  await requireAuth();
  return db.select().from(customers).orderBy(customers.name);
}

export async function getCustomersWithOrderCount() {
  await requireAuth();

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      contactNumber: customers.contactNumber,
      fbMessengerLink: customers.fbMessengerLink,
      createdAt: customers.createdAt,
      orderCount: sql<number>`count(${orders.id})::int`,
      totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)`,
    })
    .from(customers)
    .leftJoin(
      orders,
      and(eq(orders.customerId, customers.id), isNull(orders.deletedAt)),
    )
    .groupBy(customers.id)
    .orderBy(customers.name);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    contactNumber: r.contactNumber,
    fbMessengerLink: r.fbMessengerLink,
    createdAt: r.createdAt,
    orderCount: Number(r.orderCount) || 0,
    totalRevenue: Number(r.totalRevenue) || 0,
  }));
}

export async function createCustomer(data: CustomerFormValues) {
  await requireAuth();
  const parsed = customerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid customer data", data: null };
  }

  const [customer] = await db
    .insert(customers)
    .values({
      name: parsed.data.name,
      contactNumber: parsed.data.contactNumber || null,
      fbMessengerLink: parsed.data.fbMessengerLink || null,
    })
    .returning();

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/orders/new");
  return { error: null, data: customer };
}

export async function updateCustomer(
  customerId: string,
  data: CustomerFormValues,
) {
  await requireAuth();
  const idParsed = z.string().uuid().safeParse(customerId);
  if (!idParsed.success) {
    return { error: "Invalid customer ID" };
  }

  const parsed = customerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid customer data" };
  }

  await db
    .update(customers)
    .set({
      name: parsed.data.name,
      contactNumber: parsed.data.contactNumber || null,
      fbMessengerLink: parsed.data.fbMessengerLink || null,
    })
    .where(eq(customers.id, idParsed.data));

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true };
}

export async function deleteCustomer(customerId: string) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized: Admin access required to delete customers." };
  }

  const parsed = z.string().uuid().safeParse(customerId);
  if (!parsed.success) {
    return { error: "Invalid customer ID" };
  }

  // Check if customer has any non-deleted orders
  const customerOrders = await db
    .select({ value: count() })
    .from(orders)
    .where(and(eq(orders.customerId, parsed.data), isNull(orders.deletedAt)));

  if (customerOrders[0]?.value > 0) {
    return {
      error: "Cannot delete customer with existing orders. Delete their orders first.",
    };
  }

  await db.delete(customers).where(eq(customers.id, parsed.data));

  revalidatePath("/dashboard/customers");
  return { success: true };
}

export async function getCustomerById(id: string) {
  await requireAuth();
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    return null;
  }

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, parsed.data),
    with: {
      orders: {
        where: isNull(orders.deletedAt),
        with: {
          items: true,
        },
        orderBy: [desc(orders.createdAt)],
      },
    },
  });

  return customer || null;
}
