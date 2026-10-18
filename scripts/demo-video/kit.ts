import type { Locator, Page } from "@playwright/test";

/**
 * Shared pieces for the narrated walkthrough videos: the on-screen overlay
 * (captions, chapter chip, cursor, title cards) and a director that paces each
 * action against the length of its voiceover clip.
 */

/** What OVERLAY puts on `window.__demo` for the recorder to drive. */
interface DemoOverlay {
  caption(text: string, chapter?: string): void;
  move(x: number, y: number, drag?: boolean): void;
  ripple(x: number, y: number): void;
  card(html: string): void;
  hideCard(): void;
}

declare global {
  interface Window {
    __demo: DemoOverlay;
  }
}

/** Caption bar, chapter chip, fake cursor and title cards, re-drawn after every navigation. */
export const OVERLAY = `
(() => {
  const S = sessionStorage;
  const css = \`
    #demo-cap{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483646;max-width:980px;width:calc(100% - 120px);
      background:rgba(12,12,12,.92);color:#fff;font:500 19px/1.45 system-ui,Segoe UI,sans-serif;padding:14px 22px;border-left:5px solid #e3262f;
      box-shadow:0 10px 40px rgba(0,0,0,.45);pointer-events:none;transition:opacity .25s}
    #demo-cap:empty{opacity:0}
    #demo-chap{position:fixed;right:18px;top:14px;z-index:2147483646;background:#e3262f;color:#fff;font:700 12px/1 system-ui,Segoe UI,sans-serif;
      letter-spacing:.12em;text-transform:uppercase;padding:9px 12px;pointer-events:none}
    #demo-chap:empty{display:none}
    #demo-cur{position:fixed;z-index:2147483647;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(227,38,47,.35);
      border:3px solid #fff;box-shadow:0 0 0 2px rgba(0,0,0,.5);pointer-events:none;transition:left .6s cubic-bezier(.4,0,.2,1),top .6s cubic-bezier(.4,0,.2,1)}
    #demo-cur.drag{transition:none}
    .demo-ripple{position:fixed;z-index:2147483647;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #e3262f;
      pointer-events:none;animation:demo-r .55s ease-out forwards}
    @keyframes demo-r{to{transform:scale(2.6);opacity:0}}
    #demo-card{position:fixed;inset:0;z-index:2147483645;background:#121212;color:#fff;display:flex;flex-direction:column;justify-content:center;
      padding:0 110px;font-family:system-ui,Segoe UI,sans-serif}
    #demo-card .k{color:#e3262f;font:700 14px/1 system-ui;letter-spacing:.3em;text-transform:uppercase;margin-bottom:22px}
    #demo-card h1{font:800 76px/0.95 system-ui;letter-spacing:-.04em;text-transform:uppercase;margin:0 0 22px}
    #demo-card p{font-size:22px;color:#bbb;max-width:820px;margin:0}
    #demo-card ol{font-size:24px;line-height:1.7;color:#ddd;margin:0;padding-left:34px;list-style:decimal}
    #demo-card ol li::marker{color:#e3262f;font-weight:800}
    .demo-hide-email input[name="email"]{filter:blur(6px)}
  \`;
  function draw() {
    if (document.getElementById("demo-cap")) return;
    const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);
    for (const id of ["demo-cap", "demo-chap", "demo-cur"]) {
      const el = document.createElement("div"); el.id = id; document.body.appendChild(el);
    }
    if (location.pathname === "/login") document.documentElement.classList.add("demo-hide-email");
    const cap = S.getItem("demo-cap"); if (cap) document.getElementById("demo-cap").textContent = cap;
    document.getElementById("demo-chap").textContent = S.getItem("demo-chap") || "";
    const [x, y] = JSON.parse(S.getItem("demo-xy") || "[640,360]");
    const cur = document.getElementById("demo-cur"); cur.style.left = x + "px"; cur.style.top = y + "px";
    const card = S.getItem("demo-card"); if (card) api.card(card);
  }
  const api = window.__demo = {
    caption(text, chapter) {
      S.setItem("demo-cap", text); document.getElementById("demo-cap").textContent = text;
      if (chapter !== undefined) { S.setItem("demo-chap", chapter); document.getElementById("demo-chap").textContent = chapter; }
    },
    move(x, y, drag) {
      S.setItem("demo-xy", JSON.stringify([x, y])); const c = document.getElementById("demo-cur");
      c.classList.toggle("drag", !!drag); c.style.left = x + "px"; c.style.top = y + "px";
    },
    ripple(x, y) { const r = document.createElement("div"); r.className = "demo-ripple"; r.style.left = x + "px"; r.style.top = y + "px"; document.body.appendChild(r); setTimeout(() => r.remove(), 600); },
    card(html) {
      S.setItem("demo-card", html);
      let c = document.getElementById("demo-card"); if (!c) { c = document.createElement("div"); c.id = "demo-card"; document.body.appendChild(c); }
      c.innerHTML = html;
    },
    hideCard() { S.removeItem("demo-card"); document.getElementById("demo-card")?.remove(); },
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw); else draw();
})();
`;

export const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

/**
 * Paces the film against the narration: `say` shows a line as a caption once
 * the previous line has finished, and logs when it started for mux.ts.
 */
export function createDirector<Id extends string>(lines: Record<Id, string>, durations: Record<Id, number>) {
  const timeline: { id: Id; at: number }[] = [];
  let t0 = 0;
  let busyUntil = 0;

  return {
    timeline,
    /** Call right before filming starts; timeline times are relative to this. */
    start() {
      t0 = Date.now();
    },
    /** Show a narration line; waits for the previous line to finish first. */
    async say(page: Page, id: Id, chapter?: string) {
      const left = busyUntil - Date.now();
      if (left > 0) await wait(page, left);
      timeline.push({ id, at: Date.now() - t0 });
      busyUntil = Date.now() + durations[id] + 450;
      await page.evaluate(([text, chap]) => window.__demo.caption(text, chap ?? undefined), [lines[id], chapter ?? null] as const);
    },
    /** Let the current line finish before moving on. */
    async settle(page: Page, extra = 0) {
      const left = busyUntil - Date.now();
      if (left > 0) await wait(page, left);
      if (extra) await wait(page, extra);
    },
  };
}

export async function reveal(target: Locator) {
  await target.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
  await target.page().waitForTimeout(700);
}

export async function pointAt(target: Locator) {
  await target.waitFor({ state: "visible" });
  const page = target.page();
  const inView = await target.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 60 && r.bottom <= innerHeight - 130;
  });
  if (!inView) await reveal(target);
  const box = (await target.boundingBox())!;
  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await page.evaluate(([x, y]) => window.__demo.move(x, y), [x, y]);
  await page.mouse.move(x, y, { steps: 8 });
  await wait(page, 650);
  return { x, y };
}

export async function click(target: Locator, pause = 500) {
  const { x, y } = await pointAt(target);
  await target.page().evaluate(([x, y]) => window.__demo.ripple(x, y), [x, y]);
  await target.click();
  await wait(target.page(), pause);
}

export async function type(target: Locator, text: string) {
  await click(target, 150);
  await target.pressSequentially(text, { delay: 55 });
  await wait(target.page(), 300);
}

/** Press, glide and release the real mouse with the fake cursor following along. */
export async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, ms = 1200) {
  await page.evaluate(([x, y]) => window.__demo.move(x, y), [from.x, from.y]);
  await page.mouse.move(from.x, from.y, { steps: 8 });
  await wait(page, 650);
  await page.mouse.down();
  const steps = Math.max(2, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    // Ease in-out so the motion reads like a hand, not a robot.
    const t = i / steps;
    const k = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const x = Math.round(from.x + (to.x - from.x) * k);
    const y = Math.round(from.y + (to.y - from.y) * k);
    await page.mouse.move(x, y);
    await page.evaluate(([x, y]) => window.__demo.move(x, y, true), [x, y]);
  }
  await page.mouse.up();
  await page.evaluate(([x, y]) => window.__demo.move(x, y), [to.x, to.y]);
}
