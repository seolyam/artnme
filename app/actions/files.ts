"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { db } from "@/db";
import { orderFiles, orders, profiles } from "@/db/schema";
import { getSessionProfile, requireAuth } from "@/lib/auth";
import { deleteCloudinaryAsset, uploadOrderAsset } from "@/lib/cloudinary";
import { logOrderEvent } from "@/lib/order-events";

// Server actions accept up to 10 MB (next.config.ts); leave room for the form.
const MAX_BYTES = 9 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpe?g|webp|gif|svg\+xml|heic|heif)|application\/pdf)$/;
const KINDS = ["proof", "attachment"] as const;

export type OrderFileView = {
  id: string;
  kind: string;
  url: string;
  fileName: string | null;
  mimeType: string | null;
  bytes: number | null;
  createdAt: Date;
  uploadedByName: string | null;
  approvedAt: Date | null;
  approvedByName: string | null;
};

export async function getOrderFiles(orderId: string): Promise<OrderFileView[]> {
  await requireAuth();
  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) return [];
  const uploader = alias(profiles, "uploader");
  const approver = alias(profiles, "approver");

  return db
    .select({
      id: orderFiles.id,
      kind: orderFiles.kind,
      url: orderFiles.url,
      fileName: orderFiles.fileName,
      mimeType: orderFiles.mimeType,
      bytes: orderFiles.bytes,
      createdAt: orderFiles.createdAt,
      uploadedByName: uploader.fullName,
      approvedAt: orderFiles.approvedAt,
      approvedByName: approver.fullName,
    })
    .from(orderFiles)
    .leftJoin(uploader, eq(uploader.id, orderFiles.uploadedBy))
    .leftJoin(approver, eq(approver.id, orderFiles.approvedBy))
    .where(eq(orderFiles.orderId, parsed.data))
    .orderBy(asc(orderFiles.createdAt));
}

function label(kind: string, name: string | null) {
  return `${kind === "proof" ? "proof" : "file"}${name ? ` “${name}”` : ""}`;
}

/** Upload a design proof (or a file the customer sent by chat) to an order. */
export async function uploadOrderFile(formData: FormData) {
  const { user } = await getSessionProfile();
  const orderId = z.string().uuid().safeParse(formData.get("orderId"));
  const kind = z.enum(KINDS).safeParse(formData.get("kind") ?? "proof");
  const file = formData.get("file");
  if (!orderId.success || !kind.success) return { error: "Invalid upload" };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first" };
  if (file.size > MAX_BYTES) return { error: "That file is over 9 MB. Export a smaller JPG or PDF." };
  if (!ALLOWED.test(file.type)) return { error: "Use a JPG, PNG, WebP, GIF, SVG or PDF." };

  const [order] = await db
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(and(eq(orders.id, orderId.data), isNull(orders.deletedAt)));
  if (!order) return { error: "Order not found" };

  let uploaded;
  try {
    uploaded = await uploadOrderAsset(file, order.orderNumber);
  } catch (error) {
    console.error("Order file upload failed", error);
    return { error: "The upload failed. Check the connection and try again." };
  }
  if (!uploaded) return { error: "File storage (Cloudinary) isn't set up on this server." };

  const fileName = file.name || null;
  await db.transaction(async (tx) => {
    await tx.insert(orderFiles).values({
      orderId: orderId.data,
      kind: kind.data,
      url: uploaded.url,
      publicId: uploaded.publicId,
      fileName,
      mimeType: file.type || null,
      bytes: uploaded.bytes,
      uploadedBy: user.id,
    });
    await logOrderEvent(tx, {
      orderId: orderId.data,
      type: "file",
      message: `Uploaded ${label(kind.data, fileName)}`,
      actorId: user.id,
    });
  });

  revalidatePath(`/dashboard/orders/${order.orderNumber}`);
  return { success: true };
}

async function loadFile(fileId: string) {
  const parsed = z.string().uuid().safeParse(fileId);
  if (!parsed.success) return null;
  const [row] = await db
    .select({ file: orderFiles, orderNumber: orders.orderNumber })
    .from(orderFiles)
    .innerJoin(orders, eq(orders.id, orderFiles.orderId))
    .where(and(eq(orderFiles.id, parsed.data), isNull(orders.deletedAt)));
  return row ?? null;
}

/** Record (or undo) that the customer approved a proof. */
export async function setProofApproved(fileId: string, approved: boolean) {
  const { user } = await getSessionProfile();
  const row = await loadFile(fileId);
  if (!row) return { error: "File not found" };

  await db.transaction(async (tx) => {
    await tx
      .update(orderFiles)
      .set(approved ? { approvedAt: new Date(), approvedBy: user.id } : { approvedAt: null, approvedBy: null })
      .where(eq(orderFiles.id, row.file.id));
    await logOrderEvent(tx, {
      orderId: row.file.orderId,
      type: "file",
      message: approved
        ? `Customer approved ${label(row.file.kind, row.file.fileName)}`
        : `Removed the approval on ${label(row.file.kind, row.file.fileName)}`,
      actorId: user.id,
    });
  });

  revalidatePath(`/dashboard/orders/${row.orderNumber}`);
  return { success: true };
}

export async function removeOrderFile(fileId: string) {
  const { user } = await getSessionProfile();
  const row = await loadFile(fileId);
  if (!row) return { error: "File not found" };

  await db.transaction(async (tx) => {
    await tx.delete(orderFiles).where(eq(orderFiles.id, row.file.id));
    await logOrderEvent(tx, {
      orderId: row.file.orderId,
      type: "file",
      message: `Removed ${label(row.file.kind, row.file.fileName)}`,
      actorId: user.id,
    });
  });
  // Only assets uploaded from the portal carry a public id; customer uploads
  // from the website stay in Cloudinary.
  if (row.file.publicId) await deleteCloudinaryAsset(row.file.publicId, row.file.mimeType);

  revalidatePath(`/dashboard/orders/${row.orderNumber}`);
  return { success: true };
}
