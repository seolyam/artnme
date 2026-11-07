import { describe, expect, it } from "vitest";
import { PUBLIC_PAGES, ROBOTS_DISALLOW, absoluteUrl, localBusinessJsonLd } from "./seo";
import { SITE } from "./site";

describe("seo", () => {
  it("lists only the customer pages, as full addresses", () => {
    expect(PUBLIC_PAGES).toEqual(["/", "/portfolio", "/customizer", "/quote", "/contact"]);
    expect(absoluteUrl("/quote")).toMatch(/^https:\/\/[^/]+\/quote$/);
    expect(absoluteUrl("/")).not.toMatch(/\/$/);
  });

  it("keeps search engines out of staff pages and private tracking links", () => {
    for (const path of ["/dashboard", "/login", "/welcome", "/track/", "/api/"]) {
      expect(ROBOTS_DISALLOW).toContain(path);
    }
  });

  it("describes the shop for Google: address, phone, map pin, and opening hours", () => {
    const data = localBusinessJsonLd();
    expect(data["@type"]).toBe("LocalBusiness");
    expect(data.telephone).toBe("+639683292779");
    expect(data.address).toMatchObject({ addressLocality: "Silay City", addressCountry: "PH" });
    expect(data.geo).toEqual({ "@type": "GeoCoordinates", latitude: SITE.coords.lat, longitude: SITE.coords.lng });
    expect(data.openingHoursSpecification).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "18:00",
      },
    ]);
    expect(data.sameAs).toContain(SITE.facebookHref);
  });
});
