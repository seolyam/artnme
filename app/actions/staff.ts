"use server";

import { db } from "@/db";
import { orders, profiles } from "@/db/schema";
import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { requireAuth, requireAdmin, getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logOrderEvent } from "@/lib/order-events";
import { siteOrigin } from "@/lib/site-url";

/**
 * Everyone who has had an account, including deactivated staff (their names
 * still appear in history). Pickers filter on `deactivatedAt`.
 */
export async function getStaff() {
  await requireAuth();
  return db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      role: profiles.role,
      deactivatedAt: profiles.deactivatedAt,
    })
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

// ─── Staff management (admin) ───────────────────────────────────────────────

export type StaffMember = {
  id: string;
  fullName: string;
  role: "admin" | "staff";
  email: string | null;
  createdAt: Date;
  deactivatedAt: Date | null;
  lastSignInAt: Date | null;
  openJobs: number;
};

async function adminOrError() {
  try {
    return { admin: await requireAdmin() };
  } catch {
    return { error: "Only an admin can manage staff." };
  }
}

/**
 * Staff list with emails and last sign-in from Supabase Auth. `authError` is
 * set when the service-role key can't reach Supabase Auth (the list still
 * works; adding accounts and passwords don't).
 */
export async function getStaffDirectory(): Promise<{ staff: StaffMember[]; authError: string | null }> {
  await requireAdmin();

  const [rows, jobs] = await Promise.all([
    db.select().from(profiles).orderBy(asc(profiles.fullName)),
    db
      .select({ assignedTo: orders.assignedTo, n: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(isNull(orders.deletedAt), ne(orders.status, "Completed")))
      .groupBy(orders.assignedTo),
  ]);
  const openJobs = new Map(jobs.map((j) => [j.assignedTo, Number(j.n)]));

  const authUsers = new Map<string, { email: string | null; lastSignInAt: Date | null }>();
  let authError: string | null = null;
  try {
    const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) {
      authUsers.set(u.id, {
        email: u.email ?? null,
        lastSignInAt: u.last_sign_in_at ? new Date(u.last_sign_in_at) : null,
      });
    }
  } catch (error) {
    console.error("Couldn't load auth users", error);
    authError = friendlyAuthError(error instanceof Error ? error.message : String(error));
  }

  const staff = rows.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    role: p.role,
    email: authUsers.get(p.id)?.email ?? null,
    createdAt: p.createdAt,
    deactivatedAt: p.deactivatedAt,
    lastSignInAt: authUsers.get(p.id)?.lastSignInAt ?? null,
    openJobs: openJobs.get(p.id) ?? 0,
  }));
  return { staff, authError };
}

const inviteSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("invite"),
    email: z.email("Enter a valid email address").trim().toLowerCase(),
    fullName: nameSchema,
    role: z.enum(["admin", "staff"]),
  }),
  z.object({
    mode: z.literal("password"),
    email: z.email("Enter a valid email address").trim().toLowerCase(),
    fullName: nameSchema,
    role: z.enum(["admin", "staff"]),
    password: z.string().min(10, "The password needs at least 10 characters"),
  }),
]);

export type InviteStaffValues = z.input<typeof inviteSchema>;

function friendlyAuthError(message: string) {
  if (/invalid api key|SUPABASE_SERVICE_ROLE_KEY|jwt/i.test(message)) {
    return "The server's Supabase service key (SUPABASE_SERVICE_ROLE_KEY) is missing or out of date, so accounts can't be created or changed in Supabase. Update it in the hosting settings.";
  }
  if (/already (been )?registered|already exists/i.test(message)) {
    return "Someone already has an account with that email.";
  }
  if (/rate limit/i.test(message)) {
    return "Supabase is limiting emails right now. Try again later, or set a password instead.";
  }
  return message;
}

/**
 * Add a staff account. "invite" emails a sign-up link (needs email sending
 * set up in Supabase); "password" creates the account straight away with a
 * password the admin hands over.
 */
export async function inviteStaff(values: InviteStaffValues) {
  const auth = await adminOrError();
  if ("error" in auth) return { error: auth.error };
  const parsed = inviteSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const v = parsed.data;

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { error: friendlyAuthError(e instanceof Error ? e.message : String(e)) };
  }
  const result =
    v.mode === "invite"
      ? await admin.auth.admin.inviteUserByEmail(v.email, {
          data: { full_name: v.fullName },
          redirectTo: `${await siteOrigin()}/welcome`,
        })
      : await admin.auth.admin.createUser({
          email: v.email,
          password: v.password,
          email_confirm: true,
          user_metadata: { full_name: v.fullName },
        });

  if (result.error || !result.data.user) {
    return { error: friendlyAuthError(result.error?.message ?? "Couldn't create the account") };
  }

  await db
    .insert(profiles)
    .values({ id: result.data.user.id, fullName: v.fullName, role: v.role })
    .onConflictDoUpdate({ target: profiles.id, set: { fullName: v.fullName, role: v.role, deactivatedAt: null } });

  revalidatePath("/dashboard/staff");
  return { success: true, mode: v.mode };
}

export async function setStaffRole(userId: string, role: "admin" | "staff") {
  const auth = await adminOrError();
  if ("error" in auth) return { error: auth.error };
  const id = z.string().uuid().safeParse(userId);
  const r = z.enum(["admin", "staff"]).safeParse(role);
  if (!id.success || !r.success) return { error: "Invalid request" };
  if (id.data === auth.admin.user.id) return { error: "You can't change your own role. Ask another admin." };

  await db.update(profiles).set({ role: r.data }).where(eq(profiles.id, id.data));
  revalidatePath("/dashboard/staff");
  return { success: true };
}

/**
 * Deactivate or reactivate an account. The profile flag is what the portal
 * enforces (requireAuth signs a deactivated person out on their next click);
 * the Supabase Auth ban on top stops them signing in at all. If the ban can't
 * be applied (bad service key) the deactivation still stands and we say so.
 * Their open jobs go back to "unassigned"; their names stay on history.
 */
export async function setStaffActive(userId: string, active: boolean) {
  const auth = await adminOrError();
  if ("error" in auth) return { error: auth.error };
  const id = z.string().uuid().safeParse(userId);
  if (!id.success) return { error: "Invalid request" };
  if (id.data === auth.admin.user.id) return { error: "You can't deactivate your own account." };

  const target = await db.query.profiles.findFirst({ where: eq(profiles.id, id.data) });
  if (!target) return { error: "Staff member not found" };

  let banWarning: string | null = null;
  try {
    const { error } = await createAdminClient().auth.admin.updateUserById(id.data, {
      ban_duration: active ? "none" : "876000h",
    });
    if (error) throw error;
  } catch (e) {
    banWarning = friendlyAuthError(e instanceof Error ? e.message : String(e));
  }

  let unassigned = 0;
  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({ deactivatedAt: active ? null : new Date() })
      .where(eq(profiles.id, id.data));
    if (active) return;

    const released = await tx
      .update(orders)
      .set({ assignedTo: null, updatedBy: auth.admin.user.id, updatedAt: new Date() })
      .where(and(eq(orders.assignedTo, id.data), isNull(orders.deletedAt), ne(orders.status, "Completed")))
      .returning({ id: orders.id });
    unassigned = released.length;
    for (const o of released) {
      await logOrderEvent(tx, {
        orderId: o.id,
        type: "assigned",
        message: `Unassigned (${target.fullName}'s account was deactivated)`,
        actorId: auth.admin.user.id,
      });
    }
  });

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  return { success: true, unassigned, banWarning };
}

export async function setStaffPassword(userId: string, password: string) {
  const auth = await adminOrError();
  if ("error" in auth) return { error: auth.error };
  const id = z.string().uuid().safeParse(userId);
  const pw = z.string().min(10, "The password needs at least 10 characters").safeParse(password);
  if (!id.success) return { error: "Invalid request" };
  if (!pw.success) return { error: pw.error.issues[0]?.message ?? "Invalid password" };

  try {
    const { error } = await createAdminClient().auth.admin.updateUserById(id.data, { password: pw.data });
    if (error) return { error: friendlyAuthError(error.message) };
  } catch (e) {
    return { error: friendlyAuthError(e instanceof Error ? e.message : String(e)) };
  }
  return { success: true };
}
