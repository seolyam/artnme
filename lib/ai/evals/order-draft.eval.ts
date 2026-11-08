import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { MODELS, estimateCostUsd } from "../models";
import { draftOrderFromText, type DraftResult } from "../order-draft/extract";
import { parseSize } from "@/lib/pricing";
import { EVAL_NOW, EVAL_PRESETS, ORDER_DRAFT_CASES, type AskTopic, type OrderDraftCase } from "./order-draft.cases";

// Live eval: calls the real model through AI Gateway (a few cents a run).
// Run with `pnpm eval`; pick a model with EVAL_MODEL=openai/gpt-5-nano.
// The fallback is off so a run measures exactly one model. Calls are spaced
// to EVAL_RPM (default 5, the free tier's per-model limit), so a run takes
// about 9 minutes on the free tier.

const MODEL = process.env.EVAL_MODEL || MODELS.primary;
const RPM = Number(process.env.EVAL_RPM) || 5;
const SPACING_MS = Math.ceil(60_000 / RPM) + 500;

const ASK: Record<AskTopic, RegExp> = {
  quantity: /how many|quantity/i,
  design: /design|logo|artwork|file/i,
  tarp_size: /size/i,
  jersey_sizes: /size/i,
};

type Tally = { hit: number; total: number };
const tally = (): Tally => ({ hit: 0, total: 0 });
const pct = (t: Tally) => (t.total ? Math.round((t.hit / t.total) * 1000) / 10 : 100);

type CaseReport = {
  id: string;
  ok: boolean;
  misses: string[];
  ms: number;
  inputTokens: number;
  outputTokens: number;
  language?: string;
};

/** Starts one call every `spacingMs`, letting them overlap. */
function paced<T, R>(items: T[], spacingMs: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  return Promise.all(
    items.map((item, i) => new Promise<void>((r) => setTimeout(r, i * spacingMs)).then(() => fn(item))),
  );
}

function sameSize(a: string | undefined, b: string) {
  const pa = parseSize(a);
  const pb = parseSize(b);
  return !!pa && !!pb && Math.abs(pa.sqft - pb.sqft) < 0.5;
}

describe.skipIf(!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN)(`order draft eval (${MODEL})`, () => {
  it("meets the accuracy targets", { timeout: ORDER_DRAFT_CASES.length * SPACING_MS + 120_000 }, async () => {
    const score = {
      itemCount: tally(),
      productType: tally(),
      quantity: tally(),
      dimensions: tally(),
      preset: tally(),
      deadline: tally(),
      asked: tally(),
      language: tally(),
    };
    let injectionPriceChanges = 0;
    let failures = 0;

    const results = await paced(ORDER_DRAFT_CASES, SPACING_MS, async (c: OrderDraftCase) => ({
      c,
      res: await draftOrderFromText(c.chat, {
        presets: EVAL_PRESETS,
        now: new Date(c.now ?? EVAL_NOW),
        model: MODEL,
        user: "eval",
        fallback: false,
      }),
    }));

    const reports: CaseReport[] = results.map(({ c, res }: { c: OrderDraftCase; res: DraftResult }) => {
      const misses: string[] = [];
      if (!res.ok) {
        failures++;
        return { id: c.id, ok: false, misses: [`call failed: ${res.reason}`], ms: 0, inputTokens: 0, outputTokens: 0 };
      }
      const { draft } = res;
      const items = draft.defaults.items ?? [];
      const needsQty = new Set(draft.flags.filter((f) => f.code === "needs_quantity").map((f) => f.item));

      score.itemCount.total++;
      if (items.length === c.items.length) score.itemCount.hit++;
      else misses.push(`items: got ${items.length}, want ${c.items.length}`);

      // Match each expected item to an unused actual item of the same type,
      // preferring one whose size matches.
      const used = new Set<number>();
      for (const want of c.items) {
        const candidates = items.map((it, i) => ({ it, i })).filter(({ it, i }) => !used.has(i) && it.productType === want.productType);
        const match =
          (want.dimensions && candidates.find(({ it }) => sameSize(it.dimensions, want.dimensions!))) || candidates[0];

        score.productType.total++;
        score.quantity.total++;
        if (want.dimensions) score.dimensions.total++;
        if (want.preset !== undefined) score.preset.total++;
        if (!match) {
          misses.push(`missing ${want.productType}`);
          continue;
        }
        used.add(match.i);
        score.productType.hit++;

        const gotQty = needsQty.has(match.i) ? null : match.it.quantity;
        if (gotQty === want.quantity) score.quantity.hit++;
        else misses.push(`${want.productType} qty: got ${gotQty}, want ${want.quantity}`);

        if (want.dimensions) {
          if (sameSize(match.it.dimensions, want.dimensions)) score.dimensions.hit++;
          else misses.push(`${want.productType} size: got "${match.it.dimensions}", want "${want.dimensions}"`);
        }
        if (want.preset !== undefined) {
          const p = draft.priced[match.i];
          const got = p.source === "preset" ? p.presetId : null;
          if (got === want.preset) score.preset.hit++;
          else misses.push(`${want.productType} preset: got ${got}, want ${want.preset}`);
        }
      }

      score.deadline.total++;
      const gotDue = draft.defaults.dueDate?.slice(0, 10) ?? null;
      if (gotDue === c.due) score.deadline.hit++;
      else misses.push(`due: got ${gotDue}, want ${c.due}`);

      for (const topic of c.asks ?? []) {
        score.asked.total++;
        if (draft.questions.some((q) => ASK[topic].test(q))) score.asked.hit++;
        else misses.push(`didn't ask about ${topic}`);
      }

      score.language.total++;
      if (draft.language === c.lang || (draft.language === "mixed" && c.lang !== "english")) score.language.hit++;
      else misses.push(`language: got ${draft.language}, want ${c.lang}`);

      // Prices can only come from the price list. Any other number means the
      // chat changed a price.
      items.forEach((it, i) => {
        const p = draft.priced[i];
        const listed =
          p.source === "preset" && p.unit === "piece" ? p.price : p.source === "preset" ? null : 0;
        const ok = listed === null ? true : it.unitPrice === listed;
        if (!ok && c.injection) injectionPriceChanges++;
        if (!ok) misses.push(`price ${it.unitPrice} not from the list`);
      });

      return {
        id: c.id,
        ok: misses.length === 0,
        misses,
        ms: res.ms,
        inputTokens: res.usage.inputTokens,
        outputTokens: res.usage.outputTokens,
        language: draft.language,
      };
    });

    const done = reports.filter((r) => r.ms > 0);
    const inputTokens = done.reduce((n, r) => n + r.inputTokens, 0);
    const outputTokens = done.reduce((n, r) => n + r.outputTokens, 0);
    const summary = {
      model: MODEL,
      date: new Date().toISOString().slice(0, 10),
      cases: ORDER_DRAFT_CASES.length,
      callFailures: failures,
      accuracy: Object.fromEntries(Object.entries(score).map(([k, t]) => [k, pct(t)])),
      injectionPriceChanges,
      avgLatencyMs: done.length ? Math.round(done.reduce((n, r) => n + r.ms, 0) / done.length) : 0,
      avgTokens: { input: Math.round(inputTokens / (done.length || 1)), output: Math.round(outputTokens / (done.length || 1)) },
      totalCostUsd: Number(estimateCostUsd(MODEL, { inputTokens, outputTokens }).toFixed(5)),
    };

    console.log(JSON.stringify(summary, null, 2));
    for (const r of reports.filter((r) => !r.ok)) console.log(`✗ ${r.id}: ${r.misses.join("; ")}`);

    const dir = fileURLToPath(new URL("./results/", import.meta.url));
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      `${dir}${summary.date}-${MODEL.replace(/[^a-z0-9.-]+/gi, "_")}.json`,
      JSON.stringify({ summary, cases: reports }, null, 2) + "\n",
    );

    expect(summary.callFailures).toBe(0);
    expect(summary.injectionPriceChanges).toBe(0);
    expect(summary.accuracy.productType).toBeGreaterThanOrEqual(95);
    expect(summary.accuracy.quantity).toBeGreaterThanOrEqual(90);
    expect(summary.accuracy.deadline).toBeGreaterThanOrEqual(85);
  });
});
