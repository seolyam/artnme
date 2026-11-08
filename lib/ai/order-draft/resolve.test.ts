import { describe, expect, it } from "vitest";
import type { PricePresetView } from "@/app/actions/prices";
import type { DraftItem, OrderDraftOutput } from "./schema";
import { resolveDraft } from "./resolve";

const PRESETS: PricePresetView[] = [
  { id: "id-shirt", productType: "T-Shirt", label: "DTF front print", unit: "piece", price: "350.00" },
  { id: "id-tarp", productType: "Tarpaulin", label: "Tarp standard", unit: "sqft", price: "15.00" },
  { id: "id-jersey", productType: "Jersey Set", label: "Full sublimation set", unit: "piece", price: "650.00" },
  { id: "id-mug", productType: "Mug", label: "Mug print", unit: "piece", price: "180.00" },
];

// Sunday 2026-11-08, 10:00 in Manila.
const SUNDAY = new Date("2026-11-08T10:00:00+08:00");

function item(over: Partial<DraftItem> = {}): DraftItem {
  return {
    productType: "T-Shirt",
    presetRef: null,
    quantity: 10,
    sizeBreakdown: [],
    dimensions: null,
    names: [],
    notes: null,
    ...over,
  };
}

function draft(over: Partial<OrderDraftOutput> = {}): OrderDraftOutput {
  return {
    items: [item()],
    deadline: null,
    deadlinePhrase: null,
    customerName: null,
    language: "english",
    questions: [],
    replyDraft: "Thanks! We'll send the price shortly.",
    summary: "10 shirts",
    ...over,
  };
}

// The chat mentions a design, so the "no design file" question stays out of
// tests that aren't about it.
const TEXT = "here's our logo";

function run(output: OrderDraftOutput, now = SUNDAY, text = TEXT) {
  return resolveDraft(output, { presets: PRESETS, now, text });
}

const codes = (r: ReturnType<typeof run>) => r.flags.map((f) => f.code);

describe("resolveDraft · prices", () => {
  it("uses a per-piece preset of the same product type", () => {
    const r = run(draft({ items: [item({ presetRef: "p1", quantity: 50, notes: "print on back" })] }));
    expect(r.defaults.items?.[0]).toEqual({
      productType: "T-Shirt",
      description: "DTF front print\nprint on back",
      quantity: 50,
      dimensions: "",
      unitPrice: 350,
    });
    expect(r.priced[0]).toEqual({ source: "preset", presetId: "id-shirt", label: "DTF front print", unit: "piece", price: 350 });
    expect(codes(r)).not.toContain("needs_price");
  });

  it("ignores a preset that belongs to another product type", () => {
    const r = run(draft({ items: [item({ productType: "Mug", presetRef: "p1" })] }));
    expect(r.defaults.items?.[0].unitPrice).toBe(0);
    expect(r.priced[0]).toEqual({ source: "none" });
    expect(r.flags).toContainEqual(expect.objectContaining({ code: "needs_price", item: 0 }));
  });

  it("treats an unknown preset ref as no price instead of failing", () => {
    const r = run(draft({ items: [item({ presetRef: "p99" })] }));
    expect(r.defaults.items?.[0].unitPrice).toBe(0);
    expect(codes(r)).toContain("needs_price");
  });

  it.each([["3x5"], ["36 x 60 in"], ["91.44 x 152.4 cm"], ["3ft x 5ft"]])(
    "prices a square-foot preset from the size %s",
    (dimensions) => {
      const r = run(draft({ items: [item({ productType: "Tarpaulin", presetRef: "p2", quantity: 1, dimensions })] }));
      expect(r.defaults.items?.[0].unitPrice).toBe(225);
      expect(r.defaults.items?.[0].dimensions).toBe(dimensions);
      expect(codes(r)).not.toContain("needs_price");
    },
  );

  it("leaves a square-foot price at 0 when the size can't be read", () => {
    const r = run(draft({ items: [item({ productType: "Tarpaulin", presetRef: "p2", quantity: 1, dimensions: "big" })] }));
    expect(r.defaults.items?.[0].unitPrice).toBe(0);
    expect(r.priced[0]).toMatchObject({ source: "preset", unit: "sqft", price: 15 });
    expect(codes(r)).toContain("needs_price");
  });
});

describe("resolveDraft · item details", () => {
  it("writes the size breakdown into the description", () => {
    const r = run(
      draft({ items: [item({ quantity: 15, sizeBreakdown: [{ size: "S", qty: 5 }, { size: "M", qty: 10 }] })] }),
    );
    expect(r.defaults.items?.[0].description).toBe("Sizes: S×5, M×10");
    expect(codes(r)).not.toContain("size_sum_mismatch");
  });

  it("keeps the stated total but flags a size breakdown that doesn't add up", () => {
    const r = run(
      draft({ items: [item({ quantity: 20, sizeBreakdown: [{ size: "S", qty: 5 }, { size: "M", qty: 10 }] })] }),
    );
    expect(r.defaults.items?.[0].quantity).toBe(20);
    expect(r.flags).toContainEqual(expect.objectContaining({ code: "size_sum_mismatch", item: 0 }));
  });

  it("uses the size total when no quantity was stated", () => {
    const r = run(
      draft({ items: [item({ quantity: null, sizeBreakdown: [{ size: "L", qty: 4 }, { size: "XL", qty: 3 }] })] }),
    );
    expect(r.defaults.items?.[0].quantity).toBe(7);
    expect(r.questions.join(" ")).not.toMatch(/how many/i);
  });

  it("asks for a quantity instead of guessing one", () => {
    const r = run(draft({ items: [item({ quantity: null })] }));
    expect(r.defaults.items?.[0].quantity).toBe(1);
    expect(r.questions).toContainEqual(expect.stringMatching(/how many/i));
    expect(codes(r)).toContain("needs_quantity");
  });

  it("lists jersey names one per line", () => {
    const r = run(
      draft({
        items: [
          item({
            productType: "Jersey Set",
            quantity: 2,
            sizeBreakdown: [{ size: "M", qty: 2 }],
            names: ["Juan 10", "Pedro 7"],
          }),
        ],
      }),
    );
    expect(r.defaults.items?.[0].description).toBe("Sizes: M×2\nNames:\n- Juan 10\n- Pedro 7");
  });

  it("flags runs above 10,000 pieces", () => {
    const r = run(draft({ items: [item({ quantity: 20000 })] }));
    expect(r.defaults.items?.[0].quantity).toBe(20000);
    expect(codes(r)).toContain("large_run");
  });

  it("keeps at most 10 items", () => {
    const r = run(draft({ items: Array.from({ length: 12 }, () => item()) }));
    expect(r.defaults.items).toHaveLength(10);
  });

  it("leaves the form's empty item in place when nothing was ordered", () => {
    const r = run(draft({ items: [] }));
    expect(r.defaults.items).toBeUndefined();
  });
});

describe("resolveDraft · deadlines (shop time)", () => {
  const due = (output: Partial<OrderDraftOutput>, now = SUNDAY) => run(draft(output), now).defaults.dueDate;

  it("reads 'this Friday' and 'next Friday' from a Sunday", () => {
    expect(due({ deadline: { kind: "weekday", weekday: "friday", which: "this" } })).toBe("2026-11-13T17:00");
    expect(due({ deadline: { kind: "weekday", weekday: "friday", which: "next" } })).toBe("2026-11-20T17:00");
  });

  it("reads the same weekday as today", () => {
    const r = run(draft({ deadline: { kind: "weekday", weekday: "sunday", which: "this" } }));
    expect(r.defaults.dueDate).toBe("2026-11-08T17:00");
    expect(codes(r)).toContain("rush");
  });

  it("rolls a month/day that has passed into next year", () => {
    expect(due({ deadline: { kind: "monthDay", month: 11, day: 1, year: null } })).toBe("2027-11-01T17:00");
    expect(due({ deadline: { kind: "monthDay", month: 12, day: 5, year: null } })).toBe("2026-12-05T17:00");
  });

  it("rolls a January date said in December into January", () => {
    const dec20 = new Date("2026-12-20T10:00:00+08:00");
    expect(due({ deadline: { kind: "monthDay", month: 1, day: 5, year: null } }, dec20)).toBe("2027-01-05T17:00");
  });

  it("counts days from the shop's date, not the server's", () => {
    // 00:30 Monday in Manila is still Sunday in New York (the test TZ) and UTC.
    const justAfterMidnight = new Date("2026-11-08T16:30:00Z");
    expect(due({ deadline: { kind: "inDays", days: 1 } }, justAfterMidnight)).toBe("2026-11-10T17:00");
  });

  it("flags a rush job (3 days or less) but not a 4-day one", () => {
    expect(codes(run(draft({ deadline: { kind: "inDays", days: 3 } })))).toContain("rush");
    expect(codes(run(draft({ deadline: { kind: "inDays", days: 4 } })))).not.toContain("rush");
  });

  it("flags a date in the past", () => {
    const r = run(draft({ deadline: { kind: "monthDay", month: 10, day: 1, year: 2026 } }));
    expect(r.defaults.dueDate).toBe("2026-10-01T17:00");
    expect(codes(r)).toContain("past_deadline");
  });

  it("drops a date that doesn't exist", () => {
    expect(due({ deadline: { kind: "monthDay", month: 2, day: 30, year: null } })).toBeUndefined();
  });

  it("leaves the due date empty when none was given", () => {
    expect(due({ deadline: null })).toBeUndefined();
  });
});

describe("resolveDraft · missing info", () => {
  it("asks for a tarpaulin size", () => {
    const r = run(draft({ items: [item({ productType: "Tarpaulin", quantity: 1 })] }));
    expect(r.questions).toContainEqual(expect.stringMatching(/size.*tarpaulin/i));
  });

  it("asks for jersey sizes", () => {
    const r = run(draft({ items: [item({ productType: "Jersey Upper", quantity: 12 })] }));
    expect(r.questions).toContainEqual(expect.stringMatching(/jersey sizes/i));
  });

  it("asks for a design file only when the chat never mentions one", () => {
    const ask = (text: string) => run(draft(), SUNDAY, text).questions.some((q) => /design/i.test(q));
    expect(ask("50 shirts please")).toBe(true);
    expect(ask("50 shirts, I'll send the logo")).toBe(false);
    expect(ask("50 shirts, naa na ko disenyo")).toBe(false);
    expect(ask("50 ka shirts, i-attach ko ang file")).toBe(false);
  });

  it("merges the model's questions without repeating a topic, at most 4", () => {
    const r = run(
      draft({
        items: [item({ productType: "Tarpaulin", quantity: 1 }), item({ productType: "Jersey Set", quantity: 12 })],
        questions: ["What size should the tarp be?", "What color?", "Pickup or delivery?", "Any rush?", "Matte or glossy?"],
      }),
      SUNDAY,
      "tarp and jerseys",
    );
    expect(r.questions).toHaveLength(4);
    expect(r.questions.filter((q) => /size/i.test(q) && /tarp/i.test(q))).toHaveLength(1);
    expect(r.questions[0]).toMatch(/tarpaulin/i);
  });
});

describe("resolveDraft · text fields", () => {
  it("caps the reply draft and summary lengths", () => {
    const r = run(draft({ replyDraft: "a".repeat(900), summary: "b".repeat(300) }));
    expect(r.replyDraft.length).toBeLessThanOrEqual(600);
    expect(r.summary.length).toBeLessThanOrEqual(160);
  });

  it("passes the customer name and language through", () => {
    const r = run(draft({ customerName: "  Ana Cruz ", language: "hiligaynon" }));
    expect(r.customerName).toBe("Ana Cruz");
    expect(r.language).toBe("hiligaynon");
  });
});
