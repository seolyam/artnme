import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_TIMEOUT_MS = 5000;

/**
 * getUser() retries for ~25s when Supabase is unreachable. Give up after a few
 * seconds and treat the visitor as signed out, so the dashboard falls through
 * to /login quickly instead of hanging the request.
 */
async function getUserWithTimeout(supabase: SupabaseClient) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), AUTH_TIMEOUT_MS);
  });
  try {
    const result = await Promise.race([
      supabase.auth.getUser().then(({ data }) => data.user),
      timeout,
    ]);
    if (result === null) {
      console.warn(`Supabase auth did not answer within ${AUTH_TIMEOUT_MS}ms`);
    }
    return result;
  } catch (error) {
    console.error("Supabase auth check failed", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to
  // debug issues with users being randomly logged out.
  const user = await getUserWithTimeout(supabase);

  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isLoginPage = pathname === "/login";

  // Edge guard: block unauthenticated dashboard access.
  if (isDashboard && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Edge guard: skip the login page if already authenticated.
  if (isLoginPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
