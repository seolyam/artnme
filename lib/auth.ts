"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

export async function getSessionProfile() {
  const user = await requireAuth();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  });
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await getSessionProfile();
  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return { user, profile };
}
