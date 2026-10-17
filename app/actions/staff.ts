"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { requireAuth, getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Everyone who can be assigned a job. */
export async function getStaff() {
  await requireAuth();
  return db
    .select({ id: profiles.id, fullName: profiles.fullName, role: profiles.role })
    .from(profiles)
    .orderBy(asc(profiles.fullName));
}

export async function getMe() {
  const { user, profile } = await getSessionProfile();
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.fullName ?? user.email?.split("@")[0] ?? "Staff",
    role: profile?.role ?? "staff",
  };
}

const nameSchema = z.string().trim().min(2, "Name is too short").max(60, "Name is too long");

export async function updateMyName(fullName: string) {
  const { user, profile } = await getSessionProfile();
  const parsed = nameSchema.safeParse(fullName);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid name" };

  if (profile) {
    await db.update(profiles).set({ fullName: parsed.data }).where(eq(profiles.id, user.id));
  } else {
    await db.insert(profiles).values({ id: user.id, fullName: parsed.data });
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

const passwordSchema = z
  .object({
    password: z.string().min(10, "Use at least 10 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

export async function changeMyPassword(password: string, confirm: string) {
  await requireAuth();
  const parsed = passwordSchema.safeParse({ password, confirm });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid password" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  return { success: true };
}
