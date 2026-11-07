import { SITE } from "@/lib/site";

/**
 * What search engines get: the public page list (app/sitemap.ts), the
 * crawler rules (app/robots.ts) and the shop's business details as
 * structured data, which Google uses for the map listing (hours, phone,
 * address). Everything comes from SITE, so it stays in step with the pages.
 */

/** Public address; set NEXT_PUBLIC_SITE_URL when the shop gets its own domain. */
export const PUBLIC_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://artnme.vercel.app").replace(/\/+$/, "");

export const PUBLIC_PAGES = ["/", "/portfolio", "/customizer", "/quote", "/contact"] as const;

/** Staff area, account emails' landing page, private order links, and the API. */
export const ROBOTS_DISALLOW = ["/dashboard", "/login", "/welcome", "/track/", "/api/", "/auth/"];

export function absoluteUrl(path: string) {
  return path === "/" ? PUBLIC_URL : `${PUBLIC_URL}${path}`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const clock = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE.name,
    legalName: SITE.legalName,
    description:
      "Digital printing studio in Silay City: custom shirts, jerseys, polos, mugs, button pins and tarpaulins.",
    url: PUBLIC_URL,
    image: `${PUBLIC_URL}/images/og-image.jpg`,
    logo: `${PUBLIC_URL}/images/art-n-me-logo.jpg`,
    telephone: SITE.phoneHref.replace(/^tel:/, ""),
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.addressLine1,
      addressLocality: "Silay City",
      addressRegion: "Negros Occidental",
      postalCode: "6116",
      addressCountry: "PH",
    },
    geo: { "@type": "GeoCoordinates", latitude: SITE.coords.lat, longitude: SITE.coords.lng },
    hasMap: SITE.mapsHref,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SITE.hours.openDays.map((d) => DAY_NAMES[d]),
        opens: clock(SITE.hours.open),
        closes: clock(SITE.hours.close),
      },
    ],
    sameAs: [SITE.facebookHref],
  };
}
