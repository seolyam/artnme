import fs from "node:fs";
import path from "node:path";
import { chromium, expect, type Browser, type Page } from "@playwright/test";
import { OVERLAY, click, createDirector, pointAt, type, wait } from "../kit";
import { NARRATION, type StepId } from "./narration";

/**
 * Records the staff portal training video: walks one demo order through a
 * full day at the counter with captions, a visible cursor and timed pauses
 * for the voiceover, then deletes everything it created.
 *
 *   tsx scripts/demo-video/staff/record.ts <outDir> [--cleanup]
 *
 * Expects <outDir>/durations.json from tts.ps1 and writes raw.webm plus
 * timeline.json for mux.ts. Run against a production server (pnpm start).
 */
const BASE = process.env.DEMO_BASE_URL ?? "http://localhost:3100";
const OUT = path.resolve(process.argv[2] ?? "scripts/demo-video/out/staff");
const email = process.env.E2E_EMAIL ?? process.env.ADMIN_EMAIL;
const password = process.env.E2E_PASSWORD ?? process.env.ADMIN_PASSWORD;
const SIZE = { width: 1280, height: 720 };

const stamp = Date.now().toString().slice(-4);
const CUSTOMER = `Maria Santos (Demo ${stamp})`;
const PHONE = `0917 555 ${stamp}`;
const PROOF = path.join(OUT, "family-reunion-proof.png");

const durations: Record<StepId, number> = JSON.parse(fs.readFileSync(path.join(OUT, "durations.json"), "utf8"));
const { timeline, start, say, settle } = createDirector(NARRATION, durations);
let orderNumber = 0;

async function go(page: Page, url: string) {
  await page.goto(BASE + url);
  await page.waitForLoadState("networkidle");
}

const section = (page: Page, heading: string | RegExp) =>
  page.locator("section", { has: page.getByRole("heading", { name: heading }) }).first();

async function makeProofImage(browser: Browser) {
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  await page.setContent(`
    <body style="margin:0;background:#f4efe6;font-family:Segoe UI,system-ui;display:flex;align-items:center;justify-content:center;height:100vh">
      <div style="width:620px;height:760px;background:#1d3557;border-radius:40px 40px 120px 120px;color:#fff;text-align:center;padding-top:150px;box-sizing:border-box;box-shadow:0 30px 60px rgba(0,0,0,.25)">
        <div style="font-size:30px;letter-spacing:.3em;color:#f1c453">SANTOS FAMILY</div>
        <div style="font-size:110px;font-weight:900;line-height:.95;margin:20px 0">REUNION<br>2026</div>
        <div style="font-size:26px;color:#a8dadc">Batangas · December 27</div>
      </div>
      <div style="position:absolute;bottom:40px;font-size:22px;color:#666">PROOF v1 — front print</div>
    </body>`);
  await page.screenshot({ path: PROOF });
  await page.close();
}

async function cleanup(browser: Browser) {
  if (!orderNumber) return;
  console.log(`Cleaning up order #${orderNumber} and ${CUSTOMER}`);
  const context = await browser.newContext({ viewport: SIZE });
  const page = await context.newPage();
  await page.goto(BASE + "/login");
  await page.fill('input[name="email"]', email!);
  await page.fill('input[name="password"]', password!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto(`${BASE}/dashboard/orders/${orderNumber}`);
  // Remove the proof so Cloudinary doesn't keep it.
  const remove = page.getByRole("button", { name: /^Remove family-reunion-proof/ });
  if (await remove.count()) {
    await remove.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("File removed")).toBeVisible();
  }
  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Move to trash" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Move to trash" }).click();
  await expect(page).toHaveURL(/\/dashboard\/orders$/);

  await page.goto(BASE + "/dashboard/orders/trash");
  await page.locator("li", { hasText: CUSTOMER }).getByRole("button", { name: "Delete forever" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete forever" }).click();
  await expect(page.getByText(`Order #${orderNumber} deleted for good`)).toBeVisible();

  await context.close();
}

/** Deletes every "Maria Santos (Demo …)" customer, including ones left by an earlier failed run. */
async function deleteDemoCustomers(browser: Browser) {
  const context = await browser.newContext({ viewport: SIZE });
  const page = await context.newPage();
  await page.goto(BASE + "/login");
  await page.fill('input[name="email"]', email!);
  await page.fill('input[name="password"]', password!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
  for (let i = 0; i < 10; i++) {
    await page.goto(BASE + "/dashboard/customers");
    await page.getByLabel("Search customers").fill("(Demo ");
    const link = page.locator("ul li a", { hasText: /Maria Santos \(Demo \d+\)/ }).first();
    if (!(await link.isVisible({ timeout: 3000 }).catch(() => false))) break;
    const name = (await link.innerText()).match(/Maria Santos \(Demo \d+\)/)![0];
    await page.getByRole("button", { name: `Edit ${name}` }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(500);
    await dialog.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete customer" }).click();
    await expect(page.getByText(`${name} deleted`)).toBeVisible();
    console.log(`Deleted customer ${name}`);
  }
  await context.close();
}

async function film(page: Page) {
  // ── Intro ────────────────────────────────────────────────────────────
  await go(page, "/login");
  await page.evaluate(() =>
    window.__demo.card(
      `<div class="k">Art 'n Me · Staff training</div><h1>Using the<br>staff portal</h1><p>Taking an order, payments, proofs, pickup, and the daily report.</p>`,
    ),
  );
  await wait(page, 300);
  await say(page, "intro");
  await settle(page);
  await page.evaluate(() => window.__demo.hideCard());

  // ── Sign in ──────────────────────────────────────────────────────────
  await say(page, "login", "1 · Sign in");
  await type(page.locator('input[name="email"]'), email!);
  await click(page.locator('input[name="password"]'), 100);
  await page.locator('input[name="password"]').pressSequentially(password!, { delay: 40 });
  await settle(page);
  await click(page.locator('button[type="submit"]'), 0);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.waitForLoadState("networkidle");

  // ── Command center ───────────────────────────────────────────────────
  await say(page, "dash1", "2 · Command center");
  for (const name of [/^Active jobs/, /^Due today/, /^Overdue/, /^Still to collect/, /^Ready for pickup/]) {
    await pointAt(page.getByRole("link", { name }).first());
    await wait(page, 900);
  }
  await say(page, "dash2");
  await pointAt(page.getByRole("heading", { name: "Needs attention" }));
  await wait(page, 2500);
  await pointAt(page.getByRole("heading", { name: /Today.s drawer/ }));
  await wait(page, 2200);
  await pointAt(page.locator("main").getByRole("link", { name: /^My jobs/ }).first());
  await settle(page);

  // ── New order ────────────────────────────────────────────────────────
  await say(page, "new1", "3 · Take an order");
  await click(page.getByRole("link", { name: /New order/i }).first(), 0);
  await expect(page).toHaveURL(/\/orders\/new/);
  await page.waitForLoadState("networkidle");
  await settle(page);

  await say(page, "new2");
  await click(page.getByRole("combobox", { name: "Customer" }));
  await type(page.getByLabel("Search customers"), "Maria");
  await click(page.getByRole("option", { name: /Add .*new customer/ }));
  const name = page.getByPlaceholder("e.g. Juan Dela Cruz");
  await name.fill("");
  await type(name, CUSTOMER);
  await type(page.getByPlaceholder("0917 123 4567"), PHONE);
  await settle(page);

  await say(page, "new3");
  const item = page.locator('[data-testid="order-item"]').first();
  await pointAt(item.getByText("Product", { exact: true }));
  await wait(page, 600);
  const qty = item.getByLabel("Qty");
  await click(qty, 100);
  await qty.fill("");
  await qty.pressSequentially("12", { delay: 80 });
  await type(item.getByLabel("Size"), "S×2, M×5, L×5");
  const price = item.getByLabel("Price each (₱)");
  await click(price, 100);
  await price.fill("");
  await price.pressSequentially("250", { delay: 80 });
  await type(item.getByLabel("Details for the designer"), "Navy shirts, gold \"Santos Family Reunion 2026\" on the front");
  await settle(page);

  await say(page, "new4");
  await click(page.getByRole("button", { name: "Tomorrow" }));
  await pointAt(page.getByText(/at 5:00\s?PM/i).first());
  await settle(page);

  await say(page, "new5");
  await click(page.getByRole("button", { name: /^Half/ }));
  await pointAt(page.getByRole("radiogroup", { name: "Payment method" }).first());
  await wait(page, 800);
  await pointAt(page.getByLabel("Order total (₱)"));
  await settle(page, 200);
  await click(page.getByRole("button", { name: "Create order" }), 0);
  await expect(page).toHaveURL(/\/dashboard\/orders\/\d+$/);
  orderNumber = Number(page.url().split("/").pop());
  await page.waitForLoadState("networkidle");

  // ── Order page ───────────────────────────────────────────────────────
  await say(page, "order1", "4 · Work the order");
  await pointAt(page.getByRole("list", { name: "Order progress" }));
  await wait(page, 4500);
  await pointAt(section(page, "Payments").getByText("Paid", { exact: true }).first());
  await settle(page);

  await say(page, "note");
  const note = page.getByLabel("Add an internal note");
  await type(note, "Customer wants the gold text a bit bigger");
  await click(page.getByRole("button", { name: "Add note" }), 1200);
  await settle(page);

  await say(page, "status1");
  await page.locator("main").evaluate((m) => m.scrollTo({ top: 0, behavior: "smooth" }));
  await wait(page, 700);
  await click(page.getByRole("button", { name: /Move to Designing/ }), 1500);
  await settle(page);

  await say(page, "proof");
  await pointAt(page.getByRole("button", { name: "Design proof" }));
  await wait(page, 800);
  const chooser = page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null);
  await click(page.getByRole("button", { name: /Choose file/ }), 0);
  const fc = await chooser;
  if (fc) await fc.setFiles(PROOF);
  else await page.getByLabel("Upload files").setInputFiles(PROOF);
  await expect(page.getByText("Latest proof")).toBeVisible({ timeout: 60_000 });
  await pointAt(page.getByText("Latest proof"));
  await settle(page);

  await say(page, "message");
  const msg = section(page, "Message customer");
  await click(msg.getByRole("tab", { name: "Proof" }));
  await pointAt(msg.getByLabel("Message text"));
  await wait(page, 1500);
  await click(msg.getByRole("button", { name: "Copy", exact: true }), 1200);
  await settle(page);

  await say(page, "approve");
  await click(page.getByRole("button", { name: "Customer approved this" }), 1200);
  await settle(page);

  await say(page, "pay1", "5 · Payments");
  await page.locator("main").evaluate((m) => m.scrollTo({ top: 0, behavior: "smooth" }));
  await wait(page, 700);
  await click(page.getByRole("button", { name: "Record payment" }).first(), 800);
  const dialog = page.getByRole("dialog");
  await type(dialog.getByLabel("Amount received"), "5000");
  await pointAt(dialog.getByText(/more than the .* still owed/));
  await settle(page);

  await say(page, "pay2");
  const amount = dialog.getByLabel("Amount received");
  await click(amount, 100);
  await amount.fill("");
  await amount.pressSequentially("1000", { delay: 90 });
  await click(dialog.getByRole("radio", { name: "GCash" }));
  await click(dialog.getByRole("button", { name: /^Record ₱/ }), 1800);
  await settle(page);

  // ── Printing → ready → release ──────────────────────────────────────
  await say(page, "status2", "6 · Pickup");
  await click(page.getByRole("button", { name: /Move to Printing/ }), 1500);
  await click(page.getByRole("button", { name: "More actions" }), 700);
  await click(page.getByRole("menuitem", { name: "Move to Ready for Pickup" }), 1500);
  await settle(page);

  await say(page, "release");
  await click(page.getByRole("button", { name: "Collect & release" }), 900);
  await pointAt(page.getByRole("dialog").getByRole("button", { name: /^Collect ₱.* & complete/ }));
  await wait(page, 1500);
  await click(page.getByRole("dialog").getByRole("button", { name: /^Collect ₱.* & complete/ }), 1500);
  await settle(page);

  await say(page, "track");
  await pointAt(page.getByRole("button", { name: "Copy link" }).first());
  await wait(page, 1500);
  const href = await page.getByRole("link", { name: "Preview" }).getAttribute("href");
  await click(page.getByRole("link", { name: "Preview" }), 0);
  // Preview opens a new tab; show the same page in this one so it's on video.
  const popup = await page.context().waitForEvent("page", { timeout: 3000 }).catch(() => null);
  await popup?.close();
  await go(page, href!.replace(/^https?:\/\/[^/]+/, ""));
  await settle(page, 500);

  // ── Board ────────────────────────────────────────────────────────────
  await go(page, "/dashboard/orders");
  await say(page, "board1", "7 · Find your work");
  const board = page.locator('main [data-testid="board-columns"]');
  for (const col of ["Pending", "Designing", "Printing", "Ready for Pickup"]) {
    await pointAt(board.locator(`section[aria-label='${col}']`).locator("h2, h3, header").first());
    await wait(page, 700);
  }
  const moveBtn = board.getByRole("button", { name: /^Move to/ }).first();
  if (await moveBtn.count()) await pointAt(moveBtn);
  await settle(page);

  await say(page, "board2");
  await click(page.getByRole("button", { name: "My jobs" }), 900);
  await click(page.getByRole("button", { name: "Overdue", exact: true }), 900);
  await click(page.getByRole("button", { name: /Clear filters/ }), 600);
  await type(page.getByLabel("Search the board"), "Maria");
  await settle(page);

  await say(page, "search");
  await page.keyboard.press("Control+k");
  await wait(page, 500);
  await type(page.getByLabel("Search orders and customers"), "Maria");
  await wait(page, 1500);
  await settle(page);
  await page.keyboard.press("Enter");
  await page.waitForLoadState("networkidle");
  await wait(page, 1000);

  // ── Customers, prices, reports ───────────────────────────────────────
  await go(page, "/dashboard/customers");
  await say(page, "cust", "8 · Customers & prices");
  await type(page.getByLabel("Search customers"), "Maria");
  await click(page.locator("ul li a", { hasText: CUSTOMER }), 0);
  await page.waitForLoadState("networkidle");
  await settle(page, 300);

  await go(page, "/dashboard/prices");
  await say(page, "prices");
  await pointAt(page.getByRole("heading", { name: /^Tarpaulin$/i }).first());
  await wait(page, 1200);
  await pointAt(page.getByRole("heading", { name: /^T-Shirt$/i }).first());
  await settle(page);

  await go(page, "/dashboard/reports");
  await say(page, "reports", "9 · End of day");
  await pointAt(page.getByText("Collected", { exact: true }).first());
  await wait(page, 1500);
  await pointAt(page.getByText("Cash in drawer", { exact: true }).first());
  await wait(page, 1500);
  await pointAt(page.getByRole("heading", { name: "By method" }));
  await wait(page, 1200);
  await pointAt(page.getByRole("heading", { name: "By staff" }));
  await settle(page);

  // ── Outro ────────────────────────────────────────────────────────────
  await page.evaluate(() => {
    window.__demo.caption("", "");
    window.__demo.card(
      `<div class="k">Remember</div><h1 style="font-size:60px">Three habits</h1><ol>
        <li>Record every payment the moment you receive it.</li>
        <li>Move the job as soon as the work changes.</li>
        <li>Keep notes on the order, not in your head.</li></ol>`,
    );
  });
  await say(page, "outro", "");
  await page.evaluate(() => window.__demo.caption(""));
  await settle(page, 1200);
}

(async () => {
  if (!email || !password) throw new Error("Set E2E_EMAIL and E2E_PASSWORD (or ADMIN_EMAIL / ADMIN_PASSWORD)");
  if (process.argv.includes("--cleanup")) {
    const browser = await chromium.launch();
    await deleteDemoCustomers(browser).finally(() => browser.close());
    return;
  }
  fs.rmSync(path.join(OUT, "video"), { recursive: true, force: true });
  const browser = await chromium.launch();
  await makeProofImage(browser);

  const context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: path.join(OUT, "video"), size: SIZE },
    permissions: ["clipboard-read", "clipboard-write"],
    colorScheme: "dark",
  });
  await context.addInitScript(OVERLAY);
  const page = await context.newPage();
  page.on("console", (m) => m.type() === "error" && console.log("[browser]", m.text()));
  start();
  let failed: unknown = null;
  try {
    await film(page);
  } catch (err) {
    failed = err;
    console.error("Filming failed:", err);
    await page.screenshot({ path: path.join(OUT, "failure.png") }).catch(() => {});
  }
  const video = page.video()!;
  await context.close();
  await video.saveAs(path.join(OUT, "raw.webm"));
  fs.writeFileSync(path.join(OUT, "timeline.json"), JSON.stringify({ timeline, durations }, null, 2));

  try {
    await cleanup(browser);
    await deleteDemoCustomers(browser);
  } finally {
    await browser.close();
  }
  if (failed) throw failed;
  console.log(`Recorded ${timeline.length} steps → ${path.join(OUT, "raw.webm")}`);
})();
