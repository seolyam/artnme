import { describe, expect, it } from "vitest";
import { rankPriceMemory, type PriceMemoryRow } from "./price-memory-rank";

function row(over: Partial<PriceMemoryRow>): PriceMemoryRow {
  return {
    productType: "T-Shirt",
    unitPrice: 350,
    quantity: 40,
    dimensions: null,
    orderNumber: 100,
    createdAt: "2026-08-01T02:00:00.000Z",
    customerId: "other",
    ...over,
  };
}

describe("rankPriceMemory", () => {
  it("returns nothing without history for the product", () => {
    expect(rankPriceMemory([], { productType: "T-Shirt" })).toEqual([]);
    expect(rankPriceMemory([row({ productType: "Mug" })], { productType: "T-Shirt" })).toEqual([]);
  });

  it("puts this customer's prices first and labels them", () => {
    const hints = rankPriceMemory(
      [
        row({ orderNumber: 3, unitPrice: 300, createdAt: "2026-10-01T00:00:00Z" }),
        row({ orderNumber: 1, unitPrice: 320, customerId: "ana", createdAt: "2026-06-01T00:00:00Z" }),
      ],
      { productType: "T-Shirt", customerId: "ana" },
    );
    expect(hints.map((h) => h.orderNumber)).toEqual([1, 3]);
    expect(hints[0].labels).toContain("this customer");
    expect(hints[1].labels).not.toContain("this customer");
  });

  it("prefers a similar quantity (0.5× to 2×) over a newer, different-sized run", () => {
    const hints = rankPriceMemory(
      [
        row({ orderNumber: 9, unitPrice: 280, quantity: 500, createdAt: "2026-10-01T00:00:00Z" }),
        row({ orderNumber: 5, unitPrice: 350, quantity: 60, createdAt: "2026-07-01T00:00:00Z" }),
      ],
      { productType: "T-Shirt", quantity: 40 },
    );
    expect(hints.map((h) => h.orderNumber)).toEqual([5, 9]);
    expect(hints[0].labels).toContain("similar qty");
    expect(hints[1].labels).not.toContain("similar qty");
  });

  it("includes the band edges", () => {
    const at = (quantity: number) =>
      rankPriceMemory([row({ quantity })], { productType: "T-Shirt", quantity: 40 })[0].labels.includes("similar qty");
    expect(at(20)).toBe(true);
    expect(at(80)).toBe(true);
    expect(at(19)).toBe(false);
    expect(at(81)).toBe(false);
  });

  it("orders ties by newest, then by order number", () => {
    const hints = rankPriceMemory(
      [
        row({ orderNumber: 1, unitPrice: 300, createdAt: "2026-01-01T00:00:00Z" }),
        row({ orderNumber: 7, unitPrice: 310, createdAt: "2026-05-01T00:00:00Z" }),
        row({ orderNumber: 8, unitPrice: 320, createdAt: "2026-05-01T00:00:00Z" }),
      ],
      { productType: "T-Shirt" },
    );
    expect(hints.map((h) => h.orderNumber)).toEqual([8, 7, 1]);
  });

  it("shows each price once and at most three", () => {
    const hints = rankPriceMemory(
      [
        row({ orderNumber: 6, unitPrice: 350, createdAt: "2026-10-06T00:00:00Z" }),
        row({ orderNumber: 5, unitPrice: 350, createdAt: "2026-10-05T00:00:00Z" }),
        row({ orderNumber: 4, unitPrice: 340, createdAt: "2026-10-04T00:00:00Z" }),
        row({ orderNumber: 3, unitPrice: 330, createdAt: "2026-10-03T00:00:00Z" }),
        row({ orderNumber: 2, unitPrice: 320, createdAt: "2026-10-02T00:00:00Z" }),
      ],
      { productType: "T-Shirt" },
    );
    expect(hints.map((h) => h.unitPrice)).toEqual([350, 340, 330]);
  });

  it("keeps the same price for different tarp sizes apart", () => {
    const hints = rankPriceMemory(
      [
        row({ productType: "Tarpaulin", unitPrice: 225, dimensions: "3x5", orderNumber: 2 }),
        row({ productType: "Tarpaulin", unitPrice: 225, dimensions: "5x3", orderNumber: 1 }),
      ],
      { productType: "Tarpaulin" },
    );
    expect(hints).toHaveLength(2);
  });
});
