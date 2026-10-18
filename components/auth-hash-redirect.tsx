"use client";

import { useEffect } from "react";

/**
 * Supabase sends invite and password-reset links to the Site URL when the
 * /welcome redirect isn't on its allow list. Catch those tokens (or the
 * "link expired" error) on whatever page they land and hand them to /welcome.
 */
export function AuthHashRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (window.location.pathname === "/welcome" || hash.length < 2) return;
    const isAuthLink =
      (/access_token=/.test(hash) && /type=(invite|recovery|signup|magiclink)/.test(hash)) ||
      /error_code=otp_expired/.test(hash);
    if (isAuthLink) window.location.replace(`/welcome${hash}`);
  }, []);
  return null;
}
