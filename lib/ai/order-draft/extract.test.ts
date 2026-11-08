import { describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import type { PricePresetView } from "@/app/actions/prices";
import { draftOrderFromText } from "./extract";
import type { OrderDraftOutput } from "./schema";

const PRESETS: PricePresetView[] = [
  { id: "id-shirt", productType: "T-Shirt", label: "DTF front print", unit: "piece", price: "350.00" },
];
const NOW = new Date("2026-11-08T10:00:00+08:00");

const OUTPUT: OrderDraftOutput = {
  items: [
    {
      productType: "T-Shirt",
      presetRef: "p1",
      quantity: 50,
      sizeBreakdown: [],
      dimensions: null,
      names: [],
      notes: "print sa likod",
    },
  ],
  deadline: { kind: "weekday", weekday: "friday", which: "this" },
  deadlinePhrase: "sa Biyernes",
  customerName: "Ana",
  language: "hiligaynon",
  questions: [],
  replyDraft: "Salamat Ana! Ipadala namon ang presyo.",
  summary: "50 shirts, back print, due Friday",
};

function modelReturning(output: unknown) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(output) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 900, noCache: 900, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 200, text: 200, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

const CHAT =
  "Hi, Ana ni. Pila ang 50 ka shirt nga may print sa likod? Kinahanglan namon sa Biyernes. " +
  "Ari logo namon. Text lang ko 0917 123 4567 ukon ana.cruz@gmail.com, fb.com/ana.cruz";

describe("draftOrderFromText", () => {
  it("never sends phone numbers, emails or profile links to the model", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const model = modelReturning(OUTPUT);
    const res = await draftOrderFromText(CHAT, { presets: PRESETS, now: NOW, model, user: "staff-1" });

    const sent = JSON.stringify(model.doGenerateCalls[0].prompt);
    expect(sent).not.toMatch(/0917|917 ?123|4567/);
    expect(sent).not.toContain("ana.cruz@gmail.com");
    expect(sent).not.toContain("fb.com/ana.cruz");
    expect(sent).toContain("[PHONE_1]");

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.contacts.phones).toEqual(["09171234567"]);
    expect(res.contacts.emails).toEqual(["ana.cruz@gmail.com"]);
    expect(res.draft.defaults.items?.[0]).toMatchObject({ quantity: 50, unitPrice: 350 });
    expect(res.draft.defaults.dueDate).toBe("2026-11-13T17:00");
  });

  it("lists presets as short refs, never ids or prices", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const model = modelReturning(OUTPUT);
    await draftOrderFromText("50 shirts", { presets: PRESETS, now: NOW, model });
    const sent = JSON.stringify(model.doGenerateCalls[0].prompt);
    expect(sent).toContain("p1: T-Shirt");
    expect(sent).not.toContain("id-shirt");
    expect(sent).not.toContain("350");
  });

  it("turns a made-up preset ref into 'needs a price', not a crash", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const bad = { ...OUTPUT, items: [{ ...OUTPUT.items[0], presetRef: "p99" }] };
    const res = await draftOrderFromText("50 shirts", { presets: PRESETS, now: NOW, model: modelReturning(bad) });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.draft.defaults.items?.[0].unitPrice).toBe(0);
    expect(res.draft.flags.map((f) => f.code)).toContain("needs_price");
  });

  it("passes failures through as a result", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await draftOrderFromText("50 shirts", {
      presets: PRESETS,
      now: NOW,
      model: modelReturning({ nope: true }),
    });
    expect(res).toEqual({ ok: false, reason: "invalid" });
  });
});
