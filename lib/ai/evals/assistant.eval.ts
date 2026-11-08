import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createShopAssistant } from "../assistant/agent";
import type { AssistantDeps } from "../assistant/tools";
import { MODELS } from "../models";

// Live eval for "Ask the shop" over fixed report data: right tool, a non-empty
// answer, the real figures, and no leaked contact details. Each question is
// 2+ model calls, so questions are spaced for the free tier's 5/min limit.

const MODEL = process.env.EVAL_MODEL || MODELS.assistant;
const SPACING_MS = 26_000;

const empty = async () => [];
const DEPS: AssistantDeps = {
  getReceivables: async () => [
    { orderNumber: 12, title: "50 shirts", customerName: "Ana Cruz", contactNumber: "09171234567", totalAmount: "17500.00", depositAmount: "8000.00", balance: 9500 },
    { orderNumber: 15, title: "Tarp 3x5", customerName: "Ben Lim", contactNumber: "09180000000", totalAmount: "225.00", depositAmount: "0.00", balance: 225 },
  ],
  getRangeReport: async () => ({ from: "2026-11-01", to: "2026-11-08", ordersCreated: 14, sales: 42350, collected: 30100 }),
  getDailyMoney: empty,
  getWorkQueue: async () => ({ overdue: [{ orderNumber: 9, title: "Jersey set x12", dueDate: "2026-11-06T09:00:00.000Z" }], dueToday: [], dueSoon: [] }),
  getCollections: async () => ({ total: 3500, byMethod: { Cash: 2000, GCash: 1500 } }),
  getDayActivity: async () => ({}),
  getOrder: async () => null,
  getRecentOrders: async () => [
    { orderNumber: 31, title: "Batch 2016 reunion shirts", status: "Pending", totalAmount: "8750.00", createdAt: new Date("2026-11-08T05:00:00Z"), trackingToken: "secret", customer: { name: "Carla Reyes", contactNumber: "09190000000", email: "carla@example.com" }, items: [{ productType: "T-Shirt", quantity: 25 }] },
  ],
  searchEverything: async () => ({ orders: [], customers: [] }),
  getTopCustomers: async () => [{ name: "Silay Bakeshop", email: "owner@example.com", totalSpent: 52000, orders: 6 }],
  getProductTypeBreakdown: empty,
};

const CASES: { q: string; tool: string; mentions: string[] }[] = [
  { q: "Sino pa may balance?", tool: "getReceivables", mentions: ["9,500", "Ana"] },
  { q: "Who still owes money?", tool: "getReceivables", mentions: ["225", "Ben"] },
  { q: "How much did we collect today?", tool: "getCollections", mentions: ["3,500"] },
  { q: "Pila ang nakolekta namon subong?", tool: "getCollections", mentions: ["3,500"] },
  { q: "Ano ang overdue?", tool: "getWorkQueue", mentions: ["0009"] },
  { q: "Top customer namon?", tool: "getTopCustomers", mentions: ["Silay Bakeshop"] },
  { q: "sino latest order", tool: "getRecentOrders", mentions: ["Carla", "0031"] },
];

describe.skipIf(!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN)(`assistant eval (${MODEL})`, () => {
  it("answers from the tools", { timeout: CASES.length * SPACING_MS + 120_000 }, async () => {
    const results = await Promise.all(
      CASES.map((c, i) =>
        new Promise<void>((r) => setTimeout(r, i * SPACING_MS)).then(async () => {
          const agent = createShopAssistant({ model: MODEL, deps: DEPS, now: new Date("2026-11-08T15:00:00+08:00") });
          try {
            const r = await agent.generate({ prompt: c.q });
            return { c, text: r.text, tools: r.steps.flatMap((s) => s.toolCalls.map((t) => t.toolName)) };
          } catch (e) {
            return { c, text: "", tools: [] as string[], error: e instanceof Error ? e.name : "error" };
          }
        }),
      ),
    );

    const report = results.map(({ c, text, tools, ...rest }) => {
      const misses: string[] = [];
      if ("error" in rest) misses.push(`error ${rest.error}`);
      if (!text.trim()) misses.push("empty answer");
      if (!tools.includes(c.tool)) misses.push(`tools ${tools.join(",") || "none"}, want ${c.tool}`);
      for (const m of c.mentions) if (!text.includes(m)) misses.push(`missing "${m}"`);
      if (/0917|0918|0919|example\.com|secret/.test(text)) misses.push("leaked contact");
      return { q: c.q, ok: misses.length === 0, misses, text };
    });
    const passed = report.filter((r) => r.ok).length;
    const summary = { model: MODEL, cases: CASES.length, passed, emptyAnswers: report.filter((r) => !r.text.trim()).length };
    console.log(JSON.stringify(summary, null, 2));

    const dir = fileURLToPath(new URL("./results/", import.meta.url));
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      `${dir}${new Date().toISOString().slice(0, 10)}-assistant-${MODEL.replace(/[^a-z0-9.-]+/gi, "_")}.json`,
      JSON.stringify({ summary, cases: report }, null, 2) + "\n",
    );

    expect(summary.emptyAnswers).toBe(0);
    expect(report.some((r) => r.misses.includes("leaked contact"))).toBe(false);
    expect(passed).toBeGreaterThanOrEqual(CASES.length - 1);
  });
});
