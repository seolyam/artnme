import { describe, expect, it } from "vitest";
import {
  DEFAULT_DUE_TIME,
  addShopDays,
  daysUntil,
  formatShopDate,
  formatShopTime,
  parseShopDateTime,
  shopDayRange,
  shopToday,
  timeAgo,
  toShopInputValue,
} from "./time";

describe("parseShopDateTime", () => {
  it("reads datetime-local values as Manila time", () => {
    expect(parseShopDateTime("2026-10-18T09:30")?.toISOString()).toBe("2026-10-18T01:30:00.000Z");
  });

  it("defaults a bare date to the 5 PM due time", () => {
    expect(DEFAULT_DUE_TIME).toBe("17:00");
    expect(parseShopDateTime("2026-10-18")?.toISOString()).toBe("2026-10-18T09:00:00.000Z");
  });

  it("leaves values that carry an offset alone", () => {
    expect(parseShopDateTime("2026-10-18T09:30Z")?.toISOString()).toBe("2026-10-18T09:30:00.000Z");
    expect(parseShopDateTime("2026-10-18T09:30+09:00")?.toISOString()).toBe("2026-10-18T00:30:00.000Z");
  });

  it("returns null for empty or invalid input", () => {
    expect(parseShopDateTime("")).toBeNull();
    expect(parseShopDateTime("   ")).toBeNull();
    expect(parseShopDateTime(null)).toBeNull();
    expect(parseShopDateTime("not a date")).toBeNull();
  });
});

describe("toShopInputValue", () => {
  it("formats in Manila time, not UTC", () => {
    // 20:00 UTC is already the next morning in Manila.
    expect(toShopInputValue(new Date("2026-10-18T20:00:00Z"))).toBe("2026-10-19T04:00");
  });

  it("round-trips with parseShopDateTime, so the edit form never shifts due dates", () => {
    const v = "2026-12-31T23:45";
    expect(toShopInputValue(parseShopDateTime(v))).toBe(v);
  });

  it("returns empty for missing or invalid dates", () => {
    expect(toShopInputValue(null)).toBe("");
    expect(toShopInputValue("garbage")).toBe("");
  });
});

describe("shop days", () => {
  it("shopToday uses the Manila calendar day", () => {
    expect(shopToday(new Date("2026-10-18T16:30:00Z"))).toBe("2026-10-19");
    expect(shopToday(new Date("2026-10-18T15:59:00Z"))).toBe("2026-10-18");
  });

  it("shopDayRange covers Manila midnight to midnight", () => {
    const { start, end } = shopDayRange("2026-10-18");
    expect(start.toISOString()).toBe("2026-10-17T16:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-18T16:00:00.000Z");
  });

  it("addShopDays crosses month and year boundaries", () => {
    expect(addShopDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addShopDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addShopDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addShopDays("2026-10-18", 0)).toBe("2026-10-18");
  });

  it("daysUntil counts shop calendar days", () => {
    const now = new Date("2026-10-18T15:00:00Z"); // 11 PM Manila
    expect(daysUntil(new Date("2026-10-18T17:00:00Z"), now)).toBe(1); // 1 AM the next day
    expect(daysUntil(new Date("2026-10-18T01:00:00Z"), now)).toBe(0);
    expect(daysUntil(new Date("2026-10-15T01:00:00Z"), now)).toBe(-3);
  });
});

describe("formatting", () => {
  it("formats dates and times in Manila", () => {
    const d = new Date("2026-10-18T20:00:00Z");
    expect(formatShopDate(d)).toMatch(/Oct\s+19/);
    expect(formatShopTime(d)).toMatch(/4:00\s?AM/i);
  });

  it("timeAgo steps from minutes to dates", () => {
    const now = new Date("2026-10-18T12:00:00Z");
    expect(timeAgo(new Date("2026-10-18T11:59:40Z"), now)).toBe("just now");
    expect(timeAgo(new Date("2026-10-18T11:55:00Z"), now)).toBe("5m ago");
    expect(timeAgo(new Date("2026-10-18T09:00:00Z"), now)).toBe("3h ago");
    expect(timeAgo(new Date("2026-10-16T12:00:00Z"), now)).toBe("2d ago");
    expect(timeAgo(new Date("2026-09-01T12:00:00Z"), now)).toMatch(/2026/);
  });
});
