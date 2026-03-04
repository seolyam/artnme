"use server";

import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { eq, count } from "drizzle-orm";
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
  const result = await db.query.customers.findMany({
    with: {
      orders: true,
    },
    orderBy: (customers, { asc }) => [asc(customers.name)],
  });

  return result.map((c) => ({
    ...c,
    orderCount: c.orders.length,
    totalRevenue: c.orders.reduce(
      (sum, o) => sum + parseFloat(o.totalAmount),
      0,
    ),
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
  return { success: true };
}

export async function deleteCustomer(customerId: string) {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: "Unauthorized: Admin access required to delete customers." };
  }

  const parsed = z.string().uuid().safeParse(customerId);
  if (!parsed.success) {
    return { error: "Invalid customer ID" };
  }

  // Check if customer has orders
  const customerOrders = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.customerId, parsed.data));

  if (customerOrders[0]?.value > 0) {
    return {
      error: "Cannot delete customer with existing orders. Delete their orders first.",
    };
  }

  await db.delete(customers).where(eq(customers.id, parsed.data));

  revalidatePath("/dashboard/customers");
  return { success: true };
}
