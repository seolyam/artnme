import "server-only";

import { headers } from "next/headers";

/**
 * The site's public origin for links we hand out (tracking pages, invite
 * redirects). NEXT_PUBLIC_SITE_URL wins; otherwise it comes from the request.
 */
export async function siteOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
