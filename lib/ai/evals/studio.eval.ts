import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { MODELS } from "../models";
import { draftStudioBrief } from "../studio";

// Live eval for "Describe your event": does the model pick the right template
// and keep the customer's words? Run with `pnpm eval`.

const MODEL = process.env.EVAL_MODEL || MODELS.primary;
const RPM = Number(process.env.EVAL_RPM) || 5;
const SPACING_MS = Math.ceil(60_000 / RPM) + 500;

type Case = { text: string; template: string; contains?: Record<string, string>; color?: string };

const CASES: Case[] = [
  { text: "Dela Cruz family reunion, Bacolod, Dec 2026, blue", template: "family-reunion", contains: { family: "Dela Cruz", year: "2026" }, color: "#1B2A4A" },
  { text: "BSIT batch 2016 homecoming", template: "batch-reunion", contains: { year: "2016" } },
  { text: "Fun run para sa cancer awareness", template: "fun-run" },
  { text: "Basketball team Silay Eagles, player Reyes number 23", template: "team-jersey", contains: { team: "Eagles", number: "23" } },
  { text: "Shirt para sa officers sang Youth Council, President si Santos", template: "club-officer", contains: { surname: "Santos" } },
  { text: "Uniform para sa amon bakeshop, Lola's Bakery", template: "business", contains: { name: "Lola" } },
  { text: "Reunion sang Villanueva clan sa Silay, 2027", template: "family-reunion", contains: { family: "Villanueva", year: "2027" } },
  { text: "Class of 1996 silver jubilee alumni homecoming, white shirt", template: "batch-reunion", contains: { year: "1996" }, color: "#FFFFFF" },
  { text: "Barangay liga volleyball team Tigers", template: "team-jersey", contains: { team: "Tigers" } },
  { text: "Color run 5K for the school foundation day", template: "fun-run" },
  { text: "Staff shirts for our coffee shop Kape Silay with our FB page", template: "business", contains: { name: "Kape Silay" } },
  { text: "SSG officers shirt, secretary Garcia", template: "club-officer", contains: { surname: "Garcia" } },
  { text: "Pamilya Gonzaga reunion sa Disyembre, red", template: "family-reunion", contains: { family: "Gonzaga" }, color: "#B31218" },
  { text: "Batch 2010 high school reunion sa Silay", template: "batch-reunion", contains: { year: "2010" } },
  { text: "Running event: Takbo para sa kalikasan 2026", template: "fun-run" },
];

describe.skipIf(!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN)(`studio brief eval (${MODEL})`, () => {
  it("picks the right template", { timeout: CASES.length * SPACING_MS + 120_000 }, async () => {
    const results = await Promise.all(
      CASES.map((c, i) =>
        new Promise<void>((r) => setTimeout(r, i * SPACING_MS)).then(async () => ({
          c,
          res: await draftStudioBrief(c.text, { model: MODEL, fallback: false }),
        })),
      ),
    );

    const allMisses: { text: string; misses: string[] }[] = [];
    let failures = 0;
    let templateHits = 0;
    let wordHits = 0;
    let wordTotal = 0;
    let colorHits = 0;
    let colorTotal = 0;
    for (const { c, res } of results) {
      if (!res.ok) {
        failures++;
        console.log(`✗ ${c.text}: call failed (${res.reason})`);
        continue;
      }
      const misses: string[] = [];
      if (res.templateId === c.template) templateHits++;
      else misses.push(`template ${res.templateId}, want ${c.template}`);
      for (const [key, want] of Object.entries(c.contains ?? {})) {
        wordTotal++;
        if ((res.values[key] ?? "").toLowerCase().includes(want.toLowerCase())) wordHits++;
        else misses.push(`${key}="${res.values[key]}", want ~"${want}"`);
      }
      if (c.color) {
        colorTotal++;
        if (res.shirtColor === c.color) colorHits++;
        else misses.push(`color ${res.shirtColor}, want ${c.color}`);
      }
      if (misses.length) {
        console.log(`✗ ${c.text}: ${misses.join("; ")}`);
        allMisses.push({ text: c.text, misses });
      }
    }
    const misses = allMisses;

    const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 100);
    const summary = {
      model: MODEL,
      cases: CASES.length,
      callFailures: failures,
      templateAccuracy: pct(templateHits, CASES.length),
      wordsKept: pct(wordHits, wordTotal),
      colorAccuracy: pct(colorHits, colorTotal),
    };
    console.log(JSON.stringify(summary, null, 2));
    const dir = fileURLToPath(new URL("./results/", import.meta.url));
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      `${dir}${new Date().toISOString().slice(0, 10)}-studio-${MODEL.replace(/[^a-z0-9.-]+/gi, "_")}.json`,
      JSON.stringify({ summary, misses }, null, 2) + "\n",
    );

    expect(summary.callFailures).toBe(0);
    expect(summary.templateAccuracy).toBeGreaterThanOrEqual(85);
  });
});
