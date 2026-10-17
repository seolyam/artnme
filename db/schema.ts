import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "staff"]);

export const orderStatusEnum = pgEnum("order_status", [
  "Pending",
  "Designing",
  "Printing",
  "Ready for Pickup",
  "Completed",
]);

export const productTypeEnum = pgEnum("product_type", [
  "Tarpaulin",
  "T-Shirt",
  "Mug",
  "Other",
]);

// ─── Tables ─────────────────────────────────────────────────────────────────

/**
 * Profiles table — extends Supabase Auth users with a role.
 * `id` references auth.users(id) in Supabase.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches auth.users.id
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("staff"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  contactNumber: text("contact_number"),
  fbMessengerLink: text("fb_messenger_link"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: integer("order_number").notNull().default(sql`nextval('order_number_seq')`),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  status: orderStatusEnum("status").notNull().default("Pending"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  assignedTo: uuid("assigned_to"),
});

/**
 * Every peso received against an order. `orders.deposit_amount` stays as the
 * running total so existing queries keep working; this table is the ledger
 * behind it (who took the money, how, and when).
 */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    method: text("method").notNull().default("Cash"),
    reference: text("reference"),
    note: text("note"),
    receivedBy: uuid("received_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("payments_order_idx").on(t.orderId),
    index("payments_created_idx").on(t.createdAt),
  ],
);

/** Append-only activity log shown as the order timeline. */
export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    message: text("message").notNull(),
    actorId: uuid("actor_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId, t.createdAt)],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productType: productTypeEnum("product_type").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(1),
  dimensions: text("dimensions"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
});

// ─── Relations ──────────────────────────────────────────────────────────────

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  events: many(orderEvents),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

// ─── Type Exports ───────────────────────────────────────────────────────────

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export const ORDER_STATUSES = [
  "Pending",
  "Designing",
  "Printing",
  "Ready for Pickup",
  "Completed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PRODUCT_TYPES = [
  "Tarpaulin",
  "T-Shirt",
  "Mug",
  "Other",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export type Payment = typeof payments.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;

/** "Adjustment" is reserved for corrections made through the order edit form. */
export const PAYMENT_METHODS = ["Cash", "GCash", "Bank transfer", "Maya", "Other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number] | "Adjustment";

export const ORDER_EVENT_TYPES = [
  "created",
  "status",
  "payment",
  "edit",
  "note",
  "assigned",
  "deleted",
  "restored",
] as const;
export type OrderEventType = (typeof ORDER_EVENT_TYPES)[number];
