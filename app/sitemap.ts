import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, absoluteUrl } from "@/lib/seo";

/** /sitemap.xml: the customer pages, so search engines find them all. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/portfolio" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/quote" ? 0.9 : 0.7,
  }));
}
