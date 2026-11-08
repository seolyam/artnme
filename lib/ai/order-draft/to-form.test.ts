import { describe, expect, it } from "vitest";
import { keepLatest, newCustomerPrefill } from "./to-form";

describe("keepLatest", () => {
  it("leaves a short chat alone", () => {
    expect(keepLatest("hello", 10)).toEqual({ text: "hello", truncated: false });
  });

  it("keeps the newest messages, starting at a line break", () => {
    const chat = ["old message one", "old message two", "new: 50 shirts", "new: by Friday"].join("\n");
    const { text, truncated } = keepLatest(chat, 34);
    expect(truncated).toBe(true);
    expect(text).toBe("new: 50 shirts\nnew: by Friday");
  });

  it("cuts mid-line when one line is longer than the limit", () => {
    const { text, truncated } = keepLatest("x".repeat(50), 20);
    expect(truncated).toBe(true);
    expect(text).toBe("x".repeat(20));
  });
});

describe("newCustomerPrefill", () => {
  it("fills the new-customer fields from the first contact of each kind", () => {
    expect(
      newCustomerPrefill("Ana Cruz", {
        phones: ["09171234567", "09180000000"],
        emails: ["ana@example.com"],
        messenger: ["https://m.me/ana"],
      }),
    ).toEqual({ name: "Ana Cruz", contact: "09171234567", email: "ana@example.com", messenger: "https://m.me/ana" });
  });

  it("puts an email in the contact field when there's no phone", () => {
    expect(newCustomerPrefill(null, { phones: [], emails: ["ana@example.com"], messenger: [] })).toEqual({
      name: "",
      contact: "ana@example.com",
      email: "ana@example.com",
      messenger: "",
    });
  });

  it("returns nothing when there's nothing to prefill", () => {
    expect(newCustomerPrefill(null, { phones: [], emails: [], messenger: [] })).toBeUndefined();
  });
});
