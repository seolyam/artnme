import { describe, expect, it } from "vitest";
import { stripQuoteMeta } from "./order-status";

describe("stripQuoteMeta", () => {
  it("drops the lines the quote form adds, keeping what the customer wrote", () => {
    const description = [
      "Jersey Set (sublimation)",
      "12 sets for our team, names on the back",
      "Contact: 0917 000 0001 · ana@example.com",
      "Needed by: Fri Nov 13 2026",
      "Attachment: logo.png",
      "Source: 3D Studio mockup",
    ].join("\n");
    expect(stripQuoteMeta(description)).toBe("Jersey Set (sublimation)\n12 sets for our team, names on the back");
  });

  it("only drops those labels at the start of a line", () => {
    expect(stripQuoteMeta("Print the word Contact: us on the back")).toBe("Print the word Contact: us on the back");
  });

  it("handles empty descriptions", () => {
    expect(stripQuoteMeta(null)).toBe("");
    expect(stripQuoteMeta("")).toBe("");
  });
});
