import { expect, test, type Page } from "@playwright/test";

/** The first-visit guide for customers: welcome popup, spotlight tour, Help button. */

const welcome = (page: Page) => page.getByRole("dialog", { name: "Welcome to Art 'n Me!" });
const card = (page: Page) => page.getByRole("dialog", { name: /./ }).filter({ hasText: /Step \d+ of \d+/ });

test("first visit offers the guide, which walks from the home page through the quote form", async ({ page }) => {
  await page.goto("/");
  await expect(welcome(page)).toBeVisible();
  await welcome(page).getByRole("button", { name: "Yes, show me how" }).click();

  await expect(card(page)).toContainText("Step 1 of 9");
  await expect(card(page)).toContainText("This is the menu");
  await card(page).getByRole("button", { name: "Next" }).click();

  // The highlighted button is clickable through the dimmed overlay, and the tour follows along.
  await expect(card(page)).toContainText("Step 2 of 9");
  await page.locator('[data-tour="nav-quote"]').click();
  await expect(page).toHaveURL(/\/quote$/);
  await expect(card(page)).toContainText("Step 3 of 9");

  // Customers can type into the highlighted fields while the guide is open.
  await page.getByLabel("Full name *").fill("Tour Test");
  await expect(page.getByLabel("Full name *")).toHaveValue("Tour Test");

  for (let n = 4; n <= 9; n++) {
    await card(page).getByRole("button", { name: "Next" }).click();
    await expect(card(page)).toContainText(`Step ${n} of 9`);
  }
  await card(page).getByRole("button", { name: "Back" }).click();
  await expect(card(page)).toContainText("Step 8 of 9");
  await card(page).getByRole("button", { name: "Next" }).click();
  await card(page).getByRole("button", { name: "Finish" }).click();
  await expect(card(page)).toBeHidden();

  // Seen once: no popup next time, but Help offers the guide again.
  await page.reload();
  await page.waitForTimeout(2000);
  await expect(welcome(page)).toBeHidden();
  await page.getByRole("button", { name: "Help" }).click();
  const help = page.getByRole("dialog", { name: "Need help?" });
  await expect(help).toBeVisible();
  // Just the two choices: start the guide or close.
  await expect(help.getByRole("button")).toHaveCount(2);
  await help.getByRole("button", { name: /No thanks/ }).click();
  await expect(help).toBeHidden();
});

test("saying no thanks is remembered", async ({ page }) => {
  await page.goto("/portfolio");
  await welcome(page).getByRole("button", { name: /No thanks/ }).click();
  await expect(welcome(page)).toBeHidden();
  await page.goto("/");
  await page.waitForTimeout(2000);
  await expect(welcome(page)).toBeHidden();
});

test("Escape closes the guide, and wandering off to another page ends it", async ({ page }) => {
  // Started from another page, the guide first takes the customer home.
  await page.goto("/contact");
  await welcome(page).getByRole("button", { name: "Yes, show me how" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(card(page)).toContainText("Step 1 of 9");
  await page.keyboard.press("Escape");
  await expect(card(page)).toBeHidden();

  await page.getByRole("button", { name: "Help" }).click();
  await page.getByRole("button", { name: "Yes, show me how" }).click();
  await expect(card(page)).toContainText("Step 1 of 9");
  await page.goBack();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(card(page)).toBeHidden();
});

test("customers opening a tracking link are not interrupted", async ({ page }) => {
  await page.goto("/track/not-a-real-token");
  await page.waitForTimeout(2000);
  await expect(welcome(page)).toBeHidden();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("points at the menu button and the hero button instead of the desktop navbar", async ({ page }) => {
    await page.goto("/");
    await welcome(page).getByRole("button", { name: "Yes, show me how" }).click();
    await expect(card(page)).toContainText("Step 1 of 9");
    await card(page).getByRole("button", { name: "Next" }).click();
    await expect(card(page)).toContainText("Step 2 of 9");
    await page.locator('[data-tour="hero-quote"]').click();
    await expect(page).toHaveURL(/\/quote$/);
    await expect(card(page)).toContainText("Step 3 of 9");
    const box = await card(page).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });
});
