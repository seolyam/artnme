"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function safeRedirectTarget(target: string | null | undefined): string {
  if (!target) return "/dashboard";
  // Only allow internal dashboard paths to prevent open-redirect.
  if (target.startsWith("/dashboard") && !target.startsWith("//")) {
    return target;
  }
  return "/dashboard";
}

export async function login(
  _prevState: { error: string; redirect?: string },
  formData: FormData,
) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required", redirect: redirectTo ?? undefined };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message, redirect: redirectTo ?? undefined };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectTarget(redirectTo));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
