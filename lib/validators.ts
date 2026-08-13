import { z } from "zod/v4";

// ─── Customer ───────────────────────────────────────────────────────────────

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  contactNumber: z.string().optional(),
  fbMessengerLink: z
    .union([z.string().url("Invalid URL"), z.literal("")])
    .optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

// ─── Order Item ─────────────────────────────────────────────────────────────

export const orderItemSchema = z.object({
  id: z.string().uuid().optional(),
  productType: z.enum(["Tarpaulin", "T-Shirt", "Mug", "Other"]),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  dimensions: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Price must be non-negative"),
});

export type OrderItemFormValues = z.infer<typeof orderItemSchema>;

// ─── Order (strict — used in server actions) ────────────────────────────────

export const orderSchema = z.object({
  customerId: z.string().uuid("Please select a customer"),
  title: z.string().min(1, "Order title is required"),
  status: z.enum([
    "Pending",
    "Designing",
    "Printing",
    "Ready for Pickup",
    "Completed",
  ]),
  totalAmount: z.coerce.number().min(0, "Total must be non-negative"),
  depositAmount: z.coerce.number().min(0, "Deposit must be non-negative"),
  dueDate: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

// ─── Order form (relaxed customerId for new-customer flow) ──────────────────

export const orderFormSchema = z.object({
  customerId: z.string().default(""),
  title: z.string().min(1, "Order title is required"),
  status: z.enum([
    "Pending",
    "Designing",
    "Printing",
    "Ready for Pickup",
    "Completed",
  ]),
  totalAmount: z.coerce.number().min(0, "Total must be non-negative"),
  depositAmount: z.coerce.number().min(0, "Deposit must be non-negative"),
  dueDate: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export type OrderFormSchemaValues = z.infer<typeof orderFormSchema>;

// ─── Status Update ──────────────────────────────────────────────────────────

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum([
    "Pending",
    "Designing",
    "Printing",
    "Ready for Pickup",
    "Completed",
  ]),
});

export type UpdateOrderStatusValues = z.infer<typeof updateOrderStatusSchema>;
