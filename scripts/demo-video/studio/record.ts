import fs from "node:fs";
import path from "node:path";
import { chromium, expect, type Browser, type Page } from "@playwright/test";
import { OVERLAY, click, createDirector, drag, pointAt, type, wait } from "../kit";
import { SITE } from "../../../lib/site";
import { NARRATION, type StepId } from "./narration";

/**
 * Records the customer guide for the 3D Studio: a family-reunion shirt from a
 * blank tee to a filled-in quote form, with captions, a visible cursor and
 * timed pauses for the voiceover. The quote is never submitted, so nothing is
 * written to the database.
 *
 *   tsx scripts/demo-video/studio/record.ts <outDir>
 *
 * Expects <outDir>/durations.json from tts.ps1 and writes raw.webm,
 * timeline.json and poster.png for mux.ts. Run against a production server
 * (pnpm start).
 */
const BASE = process.env.DEMO_BASE_URL ?? "http://localhost:3100";
const OUT = path.resolve(process.argv[2] ?? "scripts/demo-video/out/studio");
const SIZE = { width: 1280, height: 720 };
const LOGO = path.join(OUT, "santos-family-logo.png");
const MOCKUP = path.join(OUT, "artnme-shirt-design.png");
const POSTER = path.join(OUT, "poster.png");

const durations: Record<StepId, number> = JSON.parse(fs.readFileSync(path.join(OUT, "durations.json"), "utf8"));
const { timeline, start, say, settle } = createDirector(NARRATION, durations);

/**
 * Keeps the chapter chip clear of the site header and hides the studio's own
 * "watch the guide" prompt, which would be odd inside the guide itself.
 */
const STUDIO_CSS = `
(() => {
  const style = document.createElement("style");
  style.textContent = "#demo-chap{left:24px;right:auto;top:88px} [data-studio-guide]{display:none!important}";
  const add = () => document.head.appendChild(style);
  if (document.head) add(); else document.addEventListener("DOMContentLoaded", add);
})();
`;

/** On the studio page, keep captions over the shirt so the wizard panel stays readable. */
async function captionsOverStage(page: Page, on: boolean) {
  await page.evaluate((on) => {
    document.getElementById("demo-stage-css")?.remove();
    if (!on) return;
    const style = document.createElement("style");
    style.id = "demo-stage-css";
    style.textContent = "#demo-cap{left:31%;width:calc(62% - 60px);max-width:none;font-size:18px}";
    document.head.appendChild(style);
  }, on);
}

async function go(page: Page, url: string) {
  // Not "networkidle": the home page keeps streaming showcase images.
  await page.goto(BASE + url, { waitUntil: "load" });
  await wait(page, 1000);
}

/** A round family-reunion badge with a transparent background, like a customer's logo file. */
async function makeLogo(browser: Browser) {
  const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
  await page.setContent(`
    <body style="margin:0;background:transparent">
      <svg id="logo" width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI, system-ui, sans-serif">
        <defs>
          <path id="top" d="M95,400 a305,305 0 0,1 610,0" />
          <path id="bottom" d="M52,400 a348,348 0 0,0 696,0" />
        </defs>
        <circle cx="400" cy="400" r="392" fill="#f1c453" />
        <circle cx="400" cy="400" r="250" fill="#14213d" />
        <circle cx="400" cy="400" r="232" fill="none" stroke="#f1c453" stroke-width="6" />
        <text font-size="70" font-weight="900" letter-spacing="6" fill="#14213d" text-anchor="middle">
          <textPath href="#top" startOffset="50%">SANTOS FAMILY</textPath>
        </text>
        <text font-size="54" font-weight="800" letter-spacing="8" fill="#14213d" text-anchor="middle">
          <textPath href="#bottom" startOffset="50%">★ REUNION ★</textPath>
        </text>
        <path d="M400 238 l18 36 40 6 -29 28 7 40 -36 -19 -36 19 7 -40 -29 -28 40 -6z" fill="#f1c453" />
        <text x="400" y="472" font-size="132" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-4">2026</text>
        <text x="400" y="530" font-size="34" font-weight="700" fill="#f1c453" text-anchor="middle" letter-spacing="10">SILAY CITY</text>
      </svg>
    </body>`);
  await page.locator("#logo").screenshot({ path: LOGO, omitBackground: true });
  await page.close();
}

async function film(page: Page) {
  const stage = page.locator("canvas").first();
  const panel = page.getByRole("complementary", { name: "Design wizard" });
  const center = { x: 397, y: 330 };

  // ── Intro ────────────────────────────────────────────────────────────
  await go(page, "/");
  await page.evaluate(() =>
    window.__demo.card(
      `<div class="k">Art 'n Me · 3D Studio guide</div><h1>Design your<br>shirt in 3D</h1><p>No design skills needed. Pick a color, add your logo or text, and send it to us.</p>`,
    ),
  );
  await wait(page, 300);
  await say(page, "intro");
  await settle(page);
  await page.evaluate(() => window.__demo.hideCard());

  // ── Open the studio ──────────────────────────────────────────────────
  await say(page, "open", "Getting started");
  await wait(page, 600);
  await click(page.locator("header").getByRole("link", { name: "3D Studio" }).first(), 0);
  await expect(page).toHaveURL(/\/customizer/);
  await captionsOverStage(page, true);
  await stage.waitFor({ state: "visible", timeout: 30_000 });
  await wait(page, 2000);
  await settle(page);

  await say(page, "tour");
  await pointAt(stage);
  await wait(page, 2200);
  for (const label of ["Color", "Design", "Review"]) {
    await pointAt(panel.getByRole("button", { name: label, exact: false }).first());
    await wait(page, 900);
  }
  await settle(page);

  // ── Step 1: color ────────────────────────────────────────────────────
  await say(page, "color1", "Step 1 · Color");
  for (const color of ["Black", "Red", "Gold"]) await click(page.getByRole("radio", { name: color }), 1300);
  await settle(page);

  await say(page, "color2");
  await click(page.getByRole("radio", { name: "Navy" }), 1500);
  await click(page.getByRole("button", { name: /Next: add your design/ }), 900);
  await settle(page);

  // ── Step 2: design ───────────────────────────────────────────────────
  await say(page, "upload1", "Step 2 · Design");
  await pointAt(page.getByRole("button", { name: "Upload design images" }));
  await wait(page, 2500);
  const chooser = page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null);
  await click(page.getByRole("button", { name: "Upload design images" }), 0);
  const fc = await chooser;
  if (fc) await fc.setFiles(LOGO);
  else await page.locator('input[type="file"]').setInputFiles(LOGO);
  await expect(page.getByRole("option", { name: /santos-family-logo/i })).toBeVisible();
  await settle(page);

  await say(page, "upload2");
  await pointAt(stage);
  await settle(page, 300);

  await say(page, "place");
  await pointAt(page.getByText("Quick Placement", { exact: true }));
  await wait(page, 1500);
  await click(page.getByRole("button", { name: "Left Chest", exact: true }), 2600);
  await click(page.getByRole("button", { name: "Full Front", exact: true }), 2400);
  await click(page.getByRole("button", { name: "Center Chest", exact: true }), 1200);
  await settle(page);

  await say(page, "size");
  const width = page.locator('input[type="range"]').first();
  await pointAt(width);
  const box = (await width.boundingBox())!;
  // Range runs 0.08–0.70; Center chest sets 0.30.
  const at = (v: number) => ({ x: Math.round(box.x + ((v - 0.08) / 0.62) * box.width), y: Math.round(box.y + box.height / 2) });
  await drag(page, at(0.3), at(0.4), 1400);
  await wait(page, 800);
  await drag(page, at(0.4), at(0.26), 1100);
  await settle(page);

  await say(page, "nudge");
  for (let i = 0; i < 3; i++) await click(page.getByRole("button", { name: "Move up" }), 350);
  await click(page.getByRole("button", { name: "Move left" }), 450);
  await click(page.getByRole("button", { name: "Move right" }), 450);
  await settle(page);

  await say(page, "text1");
  await type(page.getByLabel("Text to print on the shirt"), "SANTOS");
  await click(page.getByRole("button", { name: "Text color Gold" }), 900);
  await settle(page);

  await say(page, "text2");
  await click(page.getByRole("button", { name: "Add text layer" }), 1200);
  await pointAt(stage);
  await settle(page);

  await say(page, "back1");
  await click(page.getByRole("button", { name: "Upper Back", exact: true }), 1000);
  await pointAt(stage);
  await settle(page);

  await say(page, "back2");
  await click(page.getByRole("group", { name: "Camera" }).getByRole("button", { name: /Back/ }), 1500);
  await settle(page);

  await say(page, "spin");
  // OrbitControls turns a full circle per canvas height (720px) of drag.
  await drag(page, { x: center.x - 180, y: center.y }, { x: center.x + 180, y: center.y }, 2200);
  await wait(page, 500);
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, -120);
    await wait(page, 90);
  }
  await wait(page, 900);
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 120);
    await wait(page, 90);
  }
  await settle(page);

  await say(page, "layers");
  const logoLayer = page.getByRole("option", { name: /santos-family-logo/i });
  await pointAt(page.getByRole("listbox", { name: "Design layers" }));
  await wait(page, 1200);
  await click(logoLayer, 900);
  await click(logoLayer.getByRole("button", { name: "Hide layer" }), 1400);
  await click(logoLayer.getByRole("button", { name: "Show layer" }), 900);
  await pointAt(logoLayer.getByRole("button", { name: "Delete layer" }));
  await settle(page);
  // Deselect so the red selection ring stays out of the review shots.
  await click(logoLayer, 600);

  await say(page, "next2");
  await click(page.getByRole("button", { name: /Next: review & export/ }), 900);
  await settle(page);

  // ── Step 3: review ───────────────────────────────────────────────────
  await say(page, "review", "Step 3 · Review");
  await pointAt(panel.locator("dl"));
  await wait(page, 1500);
  await drag(page, { x: center.x - 120, y: center.y }, { x: center.x + 240, y: center.y }, 2600);
  await settle(page);

  await say(page, "download");
  const download = page.waitForEvent("download", { timeout: 30_000 });
  await click(page.getByRole("button", { name: /Download 4-angle mockup/ }), 0);
  await (await download).saveAs(MOCKUP);
  await settle(page);

  await say(page, "mockup");
  await page.route("**/__demo/mockup.png", (route) => route.fulfill({ path: MOCKUP }));
  await page.evaluate(() => {
    const el = document.createElement("div");
    el.id = "demo-mockup";
    el.style.cssText =
      "position:fixed;inset:0;z-index:2147483645;background:rgba(10,10,10,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding-bottom:120px;font:600 13px system-ui;letter-spacing:.14em;color:#bbb;text-transform:uppercase";
    el.innerHTML = `<img src="/__demo/mockup.png" style="max-height:470px;max-width:90vw;box-shadow:0 30px 70px rgba(0,0,0,.6)"><span>artnme-shirt-design.png</span>`;
    document.body.appendChild(el);
  });
  await settle(page, 400);
  await page.evaluate(() => document.getElementById("demo-mockup")?.remove());

  await say(page, "saved");
  await pointAt(page.getByText("Draft autosaved", { exact: true }));
  await wait(page, 4500);
  await pointAt(page.getByRole("button", { name: /Start over/ }));
  await settle(page);

  // ── Send it to us ────────────────────────────────────────────────────
  await say(page, "quote1", "Send it to us");
  await click(page.getByRole("link", { name: /Send to quote/ }), 0);
  await expect(page).toHaveURL(/\/quote/);
  await captionsOverStage(page, false);
  await page.getByLabel("Full name *").waitFor();
  await settle(page, 300);

  await say(page, "quote2");
  await type(page.getByLabel("Full name *"), "Ana Santos");
  await type(page.getByLabel("Phone number *"), "0917 123 4567");
  await type(page.getByLabel("Email *"), "juan@email.com");
  await pointAt(page.getByRole("button", { name: /T-Shirt/i, pressed: true }));
  await wait(page, 900);
  const qty = page.getByRole("spinbutton", { name: "Quantity" });
  await click(qty, 100);
  await qty.press("Control+a");
  await qty.pressSequentially("20", { delay: 120 });
  await type(page.getByLabel("Project details"), "Family reunion shirts. S x5, M x10, L x5");
  await settle(page);

  await say(page, "quote3");
  const attach = page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null);
  await click(page.getByText("Attach your design", { exact: true }), 0);
  const fc2 = await attach;
  if (fc2) await fc2.setFiles(MOCKUP);
  else await page.locator('input[name="attachment"]').setInputFiles(MOCKUP);
  await pointAt(page.getByText("artnme-shirt-design.png", { exact: true }));
  await settle(page);

  await say(page, "quote4");
  await pointAt(page.getByRole("button", { name: /Submit inquiry/ }));
  await settle(page, 300);

  // ── Outro ────────────────────────────────────────────────────────────
  await page.evaluate(
    ([fb, phone]) => {
      window.__demo.caption("", "");
      window.__demo.card(
        `<div class="k">Three easy steps</div><h1 style="font-size:60px">You're ready!</h1><ol>
          <li>Pick your shirt color.</li>
          <li>Add your logo or text.</li>
          <li>Download the mockup and send it to us.</li></ol>
          <p style="margin-top:34px">Need help? Message us at ${fb} or call ${phone}.</p>`,
      );
    },
    [SITE.facebookHandle, SITE.phoneDisplay],
  );
  await say(page, "outro", "");
  await page.evaluate(() => window.__demo.caption(""));
  await settle(page, 1200);
}

/** A clean shot of the finished shirt (the draft autosaved in this context) for the video thumbnail. */
async function shootPoster(page: Page) {
  await page.goto(BASE + "/customizer", { waitUntil: "load" });
  await page.locator("canvas").first().waitFor();
  await wait(page, 3000);
  await page.screenshot({ path: POSTER, style: "#demo-cap,#demo-chap,#demo-cur,[data-sonner-toaster]{display:none!important}" });
}

(async () => {
  fs.rmSync(path.join(OUT, "video"), { recursive: true, force: true });
  fs.rmSync(POSTER, { force: true });
  // The shirt is WebGL; without a real GPU, headless Chromium renders it at a few fps.
  const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
  await makeLogo(browser);

  const context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: path.join(OUT, "video"), size: SIZE },
    colorScheme: "dark",
  });
  await context.addInitScript(OVERLAY);
  await context.addInitScript(STUDIO_CSS);
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
  if (!failed) await shootPoster(await context.newPage());
  const video = page.video()!;
  await context.close();
  await video.saveAs(path.join(OUT, "raw.webm"));
  fs.writeFileSync(path.join(OUT, "timeline.json"), JSON.stringify({ timeline, durations }, null, 2));
  await browser.close();
  if (failed) throw failed;
  console.log(`Recorded ${timeline.length} steps → ${path.join(OUT, "raw.webm")}`);
})();
