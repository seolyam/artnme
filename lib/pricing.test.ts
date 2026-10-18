import { describe, expect, it } from "vitest";
import { describeSize, parseSize, priceBySize } from "./pricing";

describe("parseSize", () => {
  it.each([
    ["3x5", 15],
    ["3 x 5", 15],
    ["3ft x 5ft", 15],
    ["3 x 5 ft", 15],
    ["3'x5'", 15],
    ["4 by 8", 32],
    ["2.5×4", 10],
    ["36 x 60 in", 15],
  ])("%s → %d sq ft", (input, sqft) => {
    expect(parseSize(input)?.sqft).toBe(sqft);
  });

  it("converts metres", () => {
    expect(parseSize("1 x 2 m")?.sqft).toBeCloseTo(21.53, 1);
  });

  it("rejects things that aren't sizes", () => {
    expect(parseSize("")).toBeNull();
    expect(parseSize("large")).toBeNull();
    expect(parseSize("3x")).toBeNull();
    expect(parseSize("0x5")).toBeNull();
  });
});

describe("priceBySize", () => {
  it("multiplies area by rate to the centavo", () => {
    expect(priceBySize(parseSize("3x5")!, 18)).toBe(270);
    expect(priceBySize(parseSize("2.5x3")!, 12.5)).toBe(93.75);
  });

  it("describes the size for staff", () => {
    expect(describeSize(parseSize("3x5")!)).toBe("3 × 5 ft = 15 sq ft");
  });
});
