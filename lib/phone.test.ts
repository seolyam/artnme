import { describe, expect, it } from "vitest";
import { dialable, formatContact, isPhMobile, normalizeContact } from "./phone";

describe("normalizeContact", () => {
  it.each([
    ["09171234567", "09171234567"],
    ["0917 123 4567", "09171234567"],
    ["0917-123-4567", "09171234567"],
    ["+639171234567", "09171234567"],
    ["+63 917 123 4567", "09171234567"],
    ["639171234567", "09171234567"],
    ["9171234567", "09171234567"],
  ])("%s → %s", (input, out) => {
    expect(normalizeContact(input)).toBe(out);
  });

  it("lowercases emails and leaves landlines readable", () => {
    expect(normalizeContact(" Juan@Example.COM ")).toBe("juan@example.com");
    expect(normalizeContact("(034)  495 1234")).toBe("(034) 495 1234");
    expect(normalizeContact("")).toBe("");
    expect(normalizeContact(null)).toBe("");
  });

  it("formats and dials mobiles", () => {
    expect(isPhMobile("+63 917 123 4567")).toBe(true);
    expect(isPhMobile("(034) 495 1234")).toBe(false);
    expect(formatContact("639171234567")).toBe("0917 123 4567");
    expect(dialable("0917 123 4567")).toBe("+639171234567");
  });
});
