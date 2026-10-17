import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for admin-only work (inviting and banning
 * staff). It bypasses every auth rule, so it must never reach the browser:
 * `server-only` makes importing it from a client component a build error.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
