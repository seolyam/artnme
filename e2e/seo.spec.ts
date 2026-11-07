import { expect, test } from "@playwright/test";

/** What search engines see: robots.txt, the sitemap, and the shop's business details. */

test("robots.txt opens the customer pages and closes the staff and private ones", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain("Allow: /");
  for (const path of ["/dashboard", "/login", "/track/"]) expect(body).toContain(`Disallow: ${path}`);
  expect(body).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
});

test("the sitemap lists the customer pages", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBe(true);
  const xml = await res.text();
  for (const path of ["/portfolio", "/customizer", "/quote", "/contact"]) expect(xml).toContain(`${path}</loc>`);
  expect(xml).not.toContain("/dashboard");
});

test("the home page carries the shop's address, phone and hours for Google", async ({ page }) => {
  await page.goto("/");
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(raw!);
  expect(data["@type"]).toBe("LocalBusiness");
  expect(data.telephone).toBe("+639683292779");
  expect(data.openingHoursSpecification[0]).toMatchObject({ opens: "09:00", closes: "18:00" });
});
