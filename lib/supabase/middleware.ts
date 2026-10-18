import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError, type SupabaseClient, type User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

/** Past this we log, but keep waiting: the call may be mid token refresh. */
const AUTH_SLOW_MS = 4000;
/**
 * getUser() retries for ~25s when Supabase is unreachable, so stop waiting
 * eventually. Bailing out is "unknown", never "signed out" (see below).
 */
const AUTH_GIVE_UP_MS = 12000;

type AuthCheck =
  | { state: "signed-in"; user: User }
  | { state: "signed-out" }
  | { state: "unknown" };

/** Supabase stores the session in `sb-<ref>-auth-token`, chunked as `.0`, `.1`… */
function hasAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name));
}

async function checkUser(supabase: SupabaseClient): Promise<AuthCheck> {
  const slow = setTimeout(
    () => console.warn(`Supabase auth is slow (>${AUTH_SLOW_MS}ms); still waiting`),
    AUTH_SLOW_MS,
  );
  let giveUp: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<AuthCheck>((resolve) => {
    giveUp = setTimeout(() => resolve({ state: "unknown" }), AUTH_GIVE_UP_MS);
  });

  try {
    return await Promise.race([
      supabase.auth.getUser().then(({ data, error }): AuthCheck => {
        if (data.user) return { state: "signed-in", user: data.user };
        // A definite "no session" from Supabase. Network failures surface as
        // AuthRetryableFetchError and must not count as signed out.
        if (isAuthRetryableFetchError(error)) return { state: "unknown" };
        return { state: "signed-out" };
      }),
      timeout,
    ]);
  } catch (error) {
    console.error("Supabase auth check failed", error);
    return { state: "unknown" };
  } finally {
    clearTimeout(slow);
    clearTimeout(giveUp);
  }
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isLoginPage = pathname === "/login";

  // No session cookie means nobody is signed in: skip the Supabase round trip
  // entirely (this is every visit to /login by a signed-out person).
  if (!hasAuthCookie(request)) {
    if (isDashboard) return redirectToLogin(request, pathname);
    return NextResponse.next({ request });
  }

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
  const auth = await checkUser(supabase);

  // Only a definite answer moves anyone. On a slow or failed check we let the
  // request through untouched: the dashboard layout and every server action
  // run requireAuth() themselves, and bouncing a signed-in person to /login
  // (or dropping a half-finished token refresh) is what signs people out on
  // bad shop Wi-Fi.
  if (isDashboard && auth.state === "signed-out") {
    return withCookies(redirectToLogin(request, pathname), supabaseResponse);
  }

  if (isLoginPage && auth.state === "signed-in") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return withCookies(NextResponse.redirect(url), supabaseResponse);
  }

  return supabaseResponse;
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

/**
 * Carry over any cookies getUser() just set. A redirect that drops a freshly
 * rotated refresh token leaves the browser holding a used one, and Supabase
 * revokes the whole session the next time it is presented.
 */
function withCookies(response: NextResponse, from: NextResponse) {
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}
