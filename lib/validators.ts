import { z } from "zod/v4";
import { PAYMENT_METHODS } from "@/db/schema";

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
  depositMethod: z.enum(PAYMENT_METHODS).optional(),
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
  depositMethod: z.enum(PAYMENT_METHODS).optional(),
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

// ─── Payments & notes ───────────────────────────────────────────────────────

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Payment must be greater than 0"),
  method: z.enum(PAYMENT_METHODS).default("Cash"),
  reference: z.string().trim().max(80).optional(),
  note: z.string().trim().max(200).optional(),
});

export type PaymentValues = z.input<typeof paymentSchema>;

export const orderNoteSchema = z
  .string()
  .trim()
  .min(1, "Write something first")
  .max(1000, "Keep notes under 1,000 characters");

// ─── Public quote request ───────────────────────────────────────────────────

/** Title prefix that marks orders created from the public quote form. */
export const WEB_QUOTE_PREFIX = "Web quote";

export const QUOTE_PRODUCTS = [
  { value: "T-Shirt", label: "T-shirt", productType: "T-Shirt" },
  { value: "Jersey", label: "Jersey", productType: "Other" },
  { value: "Mug", label: "Mug", productType: "Mug" },
  { value: "Tarpaulin", label: "Tarpaulin", productType: "Tarpaulin" },
  { value: "Other", label: "Other", productType: "Other" },
] as const;

export type QuoteProduct = (typeof QUOTE_PRODUCTS)[number]["value"];

export const quoteRequestSchema = z.object({
  name: z.string().trim().min(2, "Tell us who to address the quote to.").max(80),
  contact: z
    .string()
    .trim()
    .min(5, "We need a phone number or email to send your proof.")
    .max(120)
    .refine(
      (v) => /@/.test(v) || v.replace(/\D/g, "").length >= 7,
      "Enter a valid phone number or email.",
    ),
  product: z.enum(["T-Shirt", "Jersey", "Mug", "Tarpaulin", "Other"]),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(10000, "For runs over 10,000 pieces, message us directly."),
  neededBy: z
    .string()
    .optional()
    .refine(
      (v) => !v || !Number.isNaN(Date.parse(v)),
      "Pick a valid date.",
    ),
  details: z.string().trim().max(2000, "Keep details under 2,000 characters.").optional(),
  source: z.string().max(40).optional(),
});

export type QuoteRequestValues = z.infer<typeof quoteRequestSchema>;
