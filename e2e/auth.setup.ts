import { expect, test as setup } from "@playwright/test";

const email = process.env.E2E_EMAIL ?? process.env.ADMIN_EMAIL;
const password = process.env.E2E_PASSWORD ?? process.env.ADMIN_PASSWORD;

setup("sign in", async ({ page }) => {
  if (!email || !password) throw new Error("Set E2E_EMAIL and E2E_PASSWORD (or ADMIN_EMAIL / ADMIN_PASSWORD)");
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: "e2e/.auth/staff.json" });
});
