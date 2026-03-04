import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
});

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
