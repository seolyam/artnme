import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";

/**
 * Plain server helpers — deliberately not "use server", which would publish
 * every export as a client-callable endpoint.
 *
 * Both lookups are wrapped in React cache(), so the layout, getMe() and the
 * page's actions share one Supabase getUser() and one profile query per
 * request instead of repeating them.
 */
const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return error ? null : user;
});

const getProfile = cache(async (userId: string) => {
  return db.query.profiles.findFirst({ where: eq(profiles.id, userId) });
});

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function getSessionProfile() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await getSessionProfile();
  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return { user, profile };
}
