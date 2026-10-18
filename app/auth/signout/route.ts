import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * Where requireAuth() sends a deactivated account. It only signs out someone
 * who really is deactivated, so a stray link can't log a working person out.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();
  url.search = "";

  if (user) {
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) });
    if (!profile?.deactivatedAt) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    await supabase.auth.signOut();
  }

  url.pathname = "/login";
  url.searchParams.set("notice", "deactivated");
  return NextResponse.redirect(url);
}
