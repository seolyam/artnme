import { describe, expect, it } from "vitest";
import { artworkHint, effectiveDpi, printAreaFor, verdict } from "./print-size";

describe("printAreaFor", () => {
  it("uses the product's print area in inches", () => {
    expect(printAreaFor("T-Shirt")).toEqual({ width: 11, height: 14 });
    expect(printAreaFor("Mug")).toEqual({ width: 8, height: 3.25 });
    expect(printAreaFor("Button Pins")).toEqual({ width: 2.25, height: 2.25 });
    expect(printAreaFor("Jersey Set")).toEqual({ width: 20, height: 28 });
  });

  it("reads a tarpaulin's area from its size, defaulting to 3x5 ft", () => {
    expect(printAreaFor("Tarpaulin", "4x8")).toEqual({ width: 48, height: 96 });
    expect(printAreaFor("Tarpaulin", "36 x 60 in")).toEqual({ width: 36, height: 60 });
    expect(printAreaFor("Tarpaulin")).toEqual({ width: 36, height: 60 });
    expect(printAreaFor("Tarpaulin", "big")).toEqual({ width: 36, height: 60 });
  });

  it("falls back to the shirt area for anything else", () => {
    expect(printAreaFor("Other")).toEqual({ width: 11, height: 14 });
  });
});

describe("effectiveDpi", () => {
  it("is limited by the side that fills the area first", () => {
    // 2200 px across an 11 in wide area = 200 DPI; height has room to spare.
    expect(effectiveDpi({ width: 2200, height: 1100 }, { width: 11, height: 14 })).toBe(200);
    // A tall image fills the 14 in height first.
    expect(effectiveDpi({ width: 700, height: 2800 }, { width: 11, height: 14 })).toBe(200);
  });

  it("can turn the area to match a tarp image's orientation", () => {
    const area = { width: 36, height: 60 };
    expect(effectiveDpi({ width: 3000, height: 1800 }, area, { rotate: true })).toBe(50);
    expect(effectiveDpi({ width: 3000, height: 1800 }, area)).toBeCloseTo(83.33, 1);
  });
});

describe("verdict", () => {
  it("grades shirts and most products at 150 / 100 DPI", () => {
    expect(verdict(150, "T-Shirt")).toBe("good");
    expect(verdict(149.9, "T-Shirt")).toBe("okay");
    expect(verdict(100, "Mug")).toBe("okay");
    expect(verdict(99.9, "Mug")).toBe("low");
  });

  it("passes tarps at 50 DPI, since they're seen from far away", () => {
    expect(verdict(50, "Tarpaulin")).toBe("good");
    expect(verdict(49.9, "Tarpaulin")).toBe("low");
  });
});

describe("artworkHint", () => {
  it("says a sharp image is fine", () => {
    expect(artworkHint({ type: "image/png", width: 3000, height: 3000, productType: "T-Shirt" })).toMatchObject({
      verdict: "good",
    });
  });

  it("warns about a small image with its pixel size", () => {
    const hint = artworkHint({ type: "image/jpeg", width: 480, height: 480, productType: "T-Shirt" });
    expect(hint?.verdict).toBe("low");
    expect(hint?.message).toContain("480×480 px");
  });

  it("treats SVG as sharp at any size and skips PDFs", () => {
    expect(artworkHint({ type: "image/svg+xml", productType: "Tarpaulin" })?.verdict).toBe("good");
    expect(artworkHint({ type: "application/pdf", productType: "T-Shirt" })).toBeNull();
  });
});
