"use server";

import { db } from "@/db";
import { customers, orders, orderEvents, profiles } from "@/db/schema";
import { eq, isNull, sql, and, desc } from "drizzle-orm";
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
      activeCount: sql<number>`count(${orders.id}) FILTER (WHERE ${orders.status} <> 'Completed')::int`,
      totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)`,
      balance: sql<number>`coalesce(sum(${orders.totalAmount} - ${orders.depositAmount}), 0)`,
      lastOrderAt: sql<Date | null>`max(${orders.createdAt})`,
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
    activeCount: Number(r.activeCount) || 0,
    totalRevenue: Number(r.totalRevenue) || 0,
    balance: Number(r.balance) || 0,
    lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt) : null,
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

  // Orders reference the customer (trashed ones too, until they're purged),
  // so check all of them rather than letting the foreign key throw.
  const [{ live, trashed }] = await db
    .select({
      live: sql<number>`count(*) FILTER (WHERE ${orders.deletedAt} IS NULL)::int`,
      trashed: sql<number>`count(*) FILTER (WHERE ${orders.deletedAt} IS NOT NULL)::int`,
    })
    .from(orders)
    .where(eq(orders.customerId, parsed.data));

  if (Number(live) > 0) {
    return { error: "This customer has orders, so they can't be deleted." };
  }
  if (Number(trashed) > 0) {
    return { error: "This customer still has orders in the trash. Empty those first." };
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

/** Latest internal notes across one customer's orders, newest first. */
export async function getCustomerNotes(customerId: string, limit = 6) {
  await requireAuth();
  const parsed = z.string().uuid().safeParse(customerId);
  if (!parsed.success) return [];

  return db
    .select({
      id: orderEvents.id,
      message: orderEvents.message,
      createdAt: orderEvents.createdAt,
      actorName: profiles.fullName,
      orderNumber: orders.orderNumber,
      orderTitle: orders.title,
    })
    .from(orderEvents)
    .innerJoin(orders, eq(orders.id, orderEvents.orderId))
    .leftJoin(profiles, eq(profiles.id, orderEvents.actorId))
    .where(
      and(
        eq(orders.customerId, parsed.data),
        eq(orderEvents.type, "note"),
        isNull(orders.deletedAt),
      ),
    )
    .orderBy(desc(orderEvents.createdAt))
    .limit(limit);
}
