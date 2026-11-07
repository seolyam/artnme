import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW, absoluteUrl } from "@/lib/seo";

/** /robots.txt: customer pages are open to search engines; staff and private pages are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ROBOTS_DISALLOW }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
