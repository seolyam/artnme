import { expect, test, type Page } from "@playwright/test";

/**
 * One throwaway customer and order, walked through a real day at the counter:
 * take the order with a deposit, note, advance, take a payment, refuse an
 * overpayment, edit without changing anything, release, then check the
 * report, search, board filters and phone layout. Cleanup purges it all.
 */
const stamp = Date.now().toString().slice(-6);
const CUSTOMER = `E2E Test ${stamp}`;
const PHONE = `0900 111 ${stamp.slice(-4)}`;
let orderNumber = 0;

test.describe.configure({ mode: "serial" });

async function openOrder(page: Page) {
  await page.goto(`/dashboard/orders/${orderNumber}`);
  await expect(page.locator("h1")).toBeVisible();
}

const jobDue = (page: Page) =>
  page.locator("dt", { hasText: /^Due$/ }).locator("xpath=following-sibling::dd[1]");

test("create an order with a deposit for a new customer", async ({ page }) => {
  await page.goto("/dashboard/orders/new");
  await page.getByRole("combobox", { name: "Customer" }).click();
  await page.getByRole("option", { name: /Add .*new customer/ }).click();
  await page.getByPlaceholder("e.g. Juan Dela Cruz").fill(CUSTOMER);
  await page.getByPlaceholder("0917 123 4567").fill(PHONE);

  const item = page.locator('[data-testid="order-item"]').first();
  await item.getByLabel("Qty").fill("3");
  await item.getByLabel("Price each (₱)").fill("150");
  await page.getByRole("button", { name: "Tomorrow" }).click();
  await expect(page.getByText(/at 5:00\s?PM/i)).toBeVisible();
  await page.getByRole("button", { name: /^Half/ }).click();
  await expect(page.getByLabel("Order total (₱)")).toHaveValue("450");
  await expect(page.getByLabel("Downpayment received today (₱)")).toHaveValue("225");

  await page.getByRole("button", { name: "Create order" }).click();
  await expect(page).toHaveURL(/\/dashboard\/orders\/\d+$/);
  orderNumber = Number(page.url().split("/").pop());
  const payments = page.locator("section", { has: page.getByRole("heading", { name: "Payments" }) });
  await expect(payments).toContainText("₱225.00");
  await expect(page.getByText("Received ₱225.00 deposit (Cash)")).toBeVisible();
});

test("add an internal note", async ({ page }) => {
  await openOrder(page);
  await page.getByLabel("Add an internal note").fill("E2E note: customer wants the logo bigger");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("E2E note: customer wants the logo bigger")).toBeVisible();
});

test("advance the status", async ({ page }) => {
  await openOrder(page);
  await page.getByRole("button", { name: /Move to Designing/ }).click();
  await expect(page.getByText("Moved to Designing").first()).toBeVisible();
  await expect(page.getByText("Moved from Pending to Designing")).toBeVisible();
});

test("an overpayment is blocked, a normal payment is recorded", async ({ page }) => {
  await openOrder(page);
  await page.getByRole("button", { name: "Record payment" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Amount received").fill("1000");
  await expect(dialog.getByText(/more than the ₱225\.00 still owed/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: /^Record/ })).toBeDisabled();

  await dialog.getByLabel("Amount received").fill("100");
  await dialog.getByRole("radio", { name: "GCash" }).click();
  await dialog.getByRole("button", { name: "Record ₱100.00" }).click();
  await expect(page.getByText("₱100.00 recorded")).toBeVisible();
  await page.reload();
  const payments = page.locator("section", { has: page.getByRole("heading", { name: "Payments" }) });
  await expect(payments).toContainText("₱125.00");
});

test("editing without changes keeps the due date", async ({ page }) => {
  await openOrder(page);
  const before = (await jobDue(page).innerText()).trim();
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: "Edit order" })).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/orders/${orderNumber}$`));
  await page.reload();
  expect((await jobDue(page).innerText()).trim()).toBe(before);
});

test("collect the balance and release", async ({ page }) => {
  await openOrder(page);
  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Move to Ready for Pickup" }).click();
  await expect(page.getByRole("button", { name: "Collect & release" })).toBeVisible();
  await page.getByRole("button", { name: "Collect & release" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Collect ₱125.00 & complete" }).click();
  await expect(page.getByText(`Order #${orderNumber} released`)).toBeVisible();
  await page.reload();
  const payments = page.locator("section", { has: page.getByRole("heading", { name: "Payments" }) });
  await expect(payments.getByText("Paid", { exact: true }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: "Order again" })).toBeVisible();
});

test("the daily report lists today's payments for the order", async ({ page }) => {
  await page.goto("/dashboard/reports");
  const table = page.locator("main table");
  await expect(table).toContainText(CUSTOMER);
  await expect(table).toContainText("₱225.00");
  await expect(table).toContainText("₱125.00");
});

test("Ctrl+K search finds the order by number", async ({ page }) => {
  await page.goto("/dashboard");
  await page.keyboard.press("Control+k");
  await page.getByLabel("Search orders and customers").fill(`#${orderNumber}`);
  await expect(page.getByRole("option", { name: new RegExp(`#${String(orderNumber).padStart(4, "0")}`) })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/dashboard/orders/${orderNumber}$`));
});

test("board filters narrow the cards", async ({ page }) => {
  await page.goto("/dashboard/orders");
  const board = page.locator('main [data-testid="board-columns"]');
  const card = board.locator("article", { hasText: CUSTOMER });
  await page.getByLabel("Search the board").fill(CUSTOMER);
  await expect(card).toHaveCount(1);
  await expect(board.locator("section[aria-label='Completed']")).toContainText(CUSTOMER);
  // Completed jobs don't count as overdue or due.
  await page.getByRole("button", { name: "Overdue", exact: true }).click();
  await expect(card).toHaveCount(0);
  await expect(page).toHaveURL(/due=overdue/);
  await page.getByRole("button", { name: /Clear filters/ }).click();
  await page.getByRole("button", { name: "Unassigned" }).click();
  await page.getByLabel("Search the board").fill(CUSTOMER);
  await expect(card).toHaveCount(0); // the creator owns the job
  await page.getByRole("button", { name: "My jobs" }).click();
  await expect(card).toHaveCount(1);
});

test("the customer's tracking page shows status without internals", async ({ page, browser }) => {
  await openOrder(page);
  const href = await page.getByRole("link", { name: "Preview" }).getAttribute("href");
  const anon = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const track = await anon.newPage();
  await track.goto(href!);
  const main = track.locator("main");
  await expect(main).toContainText(`Order #${String(orderNumber).padStart(4, "0")}`);
  await expect(main).toContainText("Picked up");
  await expect(main).not.toContainText("E2E note");
  await expect(main).not.toContainText(PHONE);
  await anon.close();
});

test.describe("phone width", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const path of ["/dashboard", "/dashboard/orders", "/dashboard/orders/new", "/dashboard/customers", "/dashboard/reports", "/dashboard/reports/range"]) {
    test(`no sideways scrolling on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => {
        const main = document.querySelector("main")!;
        return {
          page: document.documentElement.scrollWidth - window.innerWidth,
          main: main.scrollWidth - main.clientWidth,
        };
      });
      expect(overflow.page).toBeLessThanOrEqual(0);
      expect(overflow.main).toBeLessThanOrEqual(0);
    });
  }

  test("the board is a list grouped by status", async ({ page }) => {
    await page.goto("/dashboard/orders");
    await expect(page.locator('main [data-testid="board-list"]')).toBeVisible();
    await expect(page.locator('main [data-testid="board-columns"]')).toBeHidden();
  });
});

test.afterAll(async ({ browser }) => {
  // Trash → purge the order, then delete the customer. Needs an admin login.
  if (!orderNumber) return;
  const context = await browser.newContext({ storageState: "e2e/.auth/staff.json" });
  const page = await context.newPage();
  try {
    await openOrder(page);
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Move to trash" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Move to trash" }).click();
    await expect(page).toHaveURL(/\/dashboard\/orders$/);

    await page.goto("/dashboard/orders/trash");
    await page.locator("li", { hasText: CUSTOMER }).getByRole("button", { name: "Delete forever" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete forever" }).click();
    await expect(page.getByText(`Order #${orderNumber} deleted for good`)).toBeVisible();

    await page.goto("/dashboard/customers");
    await page.getByLabel("Search customers").fill(CUSTOMER);
    await page.locator("ul li a", { hasText: CUSTOMER }).click();
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete customer" }).click();
    await expect(page.getByText(`${CUSTOMER} deleted`)).toBeVisible();
  } finally {
    await context.close();
  }
});
