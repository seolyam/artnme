"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { customers, orderFiles, orderItems, orders } from "@/db/schema";
import { uploadQuoteAttachment } from "@/lib/cloudinary";
import { QUOTE_PRODUCTS, WEB_QUOTE_PREFIX, quoteRequestSchema } from "@/lib/validators";
import { logOrderEvent } from "@/lib/order-events";
import { parseShopDateTime } from "@/lib/time";
import { normalizeContact } from "@/lib/phone";
import { findCustomerByContact } from "@/lib/customer-match";
import { notifyQuoteRequest } from "@/lib/quote-notify";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_FILE_TYPES = /^(image\/(png|jpe?g|webp|gif|svg\+xml)|application\/pdf)$/;
const MIN_FILL_MS = 2500;

export type QuoteState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
  orderNumber?: number;
  firstName?: string;
  contact?: string;
  productLabel?: string;
  quantity?: number;
};

// Best-effort per-instance throttle: 5 submissions per IP per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function isThrottled(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(ip, hits);
    return true;
  }
  hits.push(now);
  recent.set(ip, hits);
  return false;
}

export async function submitQuote(
  _prev: QuoteState,
  formData: FormData,
): Promise<QuoteState> {
  // Bots fill every field and submit instantly; pretend it worked.
  const honeypot = formData.get("company");
  const startedAt = Number(formData.get("startedAt"));
  if (
    (typeof honeypot === "string" && honeypot.length > 0) ||
    (Number.isFinite(startedAt) && Date.now() - startedAt < MIN_FILL_MS)
  ) {
    return { status: "success", firstName: "friend" };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isThrottled(ip)) {
    return {
      status: "error",
      message: "Too many requests in a short time. Please message us on Facebook instead.",
    };
  }

  const parsed = quoteRequestSchema.safeParse({
    name: formData.get("name"),
    contact: formData.get("contact"),
    email: formData.get("email"),
    product: formData.get("product"),
    quantity: formData.get("quantity"),
    neededBy: formData.get("neededBy") || undefined,
    details: formData.get("details") || undefined,
    source: formData.get("source") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return {
      status: "error",
      message: "Fill in the marked fields so we can reach you.",
      fieldErrors,
    };
  }

  const file = formData.get("attachment");
  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return {
        status: "error",
        message: "That file is over 8 MB. Send a smaller one, or bring it to the studio.",
        fieldErrors: { attachment: "Max 8 MB." },
      };
    }
    if (!ALLOWED_FILE_TYPES.test(file.type)) {
      return {
        status: "error",
        message: "Attach a PNG, JPG, WebP, SVG or PDF.",
        fieldErrors: { attachment: "Unsupported file type." },
      };
    }
    try {
      attachmentUrl = await uploadQuoteAttachment(file);
      attachmentName = file.name || null;
    } catch (error) {
      console.error("Quote attachment upload failed", error);
      return {
        status: "error",
        message: "We couldn't upload your file. Try again, or submit without it.",
        fieldErrors: { attachment: "Upload failed." },
      };
    }
  }

  const data = parsed.data;
  const product = QUOTE_PRODUCTS.find((p) => p.value === data.product)!;
  const neededBy = parseShopDateTime(data.neededBy);

  const description = [
    data.product === "Jersey" ? "Jersey (sublimation)" : null,
    data.details,
    `Contact: ${data.contact} · ${data.email}`,
    neededBy ? `Needed by: ${neededBy.toDateString()}` : null,
    data.source === "studio" ? "Source: 3D Studio mockup" : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const order = await db.transaction(async (tx) => {
      // Reuse the customer record when the same contact asks again, however
      // the number was typed this time (0917… vs +63917…).
      const existing = await findCustomerByContact(tx, data.contact);

      const customer =
        existing ??
        (
          await tx
            .insert(customers)
            .values({ name: data.name, contactNumber: normalizeContact(data.contact) })
            .returning()
        )[0];

      const [created] = await tx
        .insert(orders)
        .values({
          customerId: customer.id,
          title: `${WEB_QUOTE_PREFIX} — ${data.quantity}× ${product.label}`,
          status: "Pending",
          dueDate: neededBy,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      await tx.insert(orderItems).values({
        orderId: created.id,
        productType: product.productType,
        description,
        quantity: data.quantity,
      });

      if (attachmentUrl) {
        await tx.insert(orderFiles).values({
          orderId: created.id,
          kind: "attachment",
          url: attachmentUrl,
          fileName: attachmentName,
          mimeType: file instanceof File ? file.type || null : null,
          bytes: file instanceof File ? file.size : null,
        });
      }

      await logOrderEvent(tx, {
        orderId: created.id,
        type: "created",
        message: `Quote request received from the website${existing ? " (returning customer)" : ""}`,
      });

      return created;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");

    // Awaited so serverless runtimes don't freeze the send mid-flight.
    await notifyQuoteRequest({
      orderNumber: order.orderNumber,
      name: data.name,
      contact: data.contact,
      email: data.email,
      productLabel: product.label,
      quantity: data.quantity,
      details: data.details,
      neededBy,
      source: data.source,
      attachmentUrl,
    });

    return {
      status: "success",
      orderNumber: order.orderNumber,
      firstName: data.name.split(/\s+/)[0],
      contact: data.contact,
      productLabel: product.label,
      quantity: data.quantity,
    };
  } catch (error) {
    console.error("Failed to save quote request", error);
    return {
      status: "error",
      message: "Something went wrong on our side. Please try again or message us on Facebook.",
    };
  }
}
