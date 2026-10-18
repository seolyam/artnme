import { describe, expect, it } from "vitest";
import { ageBucket, eachDay, rangeDays, resolveRange } from "./report-range";

describe("resolveRange", () => {
  const today = "2026-10-18";

  it("defaults to the last 30 days", () => {
    expect(resolveRange(undefined, undefined, today)).toEqual({ from: "2026-09-19", to: today, days: 30 });
  });

  it("swaps reversed dates and refuses the future", () => {
    expect(resolveRange("2026-10-10", "2026-10-01", today)).toMatchObject({ from: "2026-10-01", to: "2026-10-10" });
    expect(resolveRange("2026-10-01", "2027-01-01", today).to).toBe(today);
  });

  it("caps the range at a year and ignores junk", () => {
    expect(resolveRange("2020-01-01", today, today).days).toBe(366);
    expect(resolveRange("nope", "also-nope", today).to).toBe(today);
  });

  it("counts and lists days inclusively", () => {
    expect(rangeDays("2026-10-01", "2026-10-01")).toBe(1);
    expect(eachDay("2026-10-30", "2026-11-02")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
  });

  it("buckets balances by age", () => {
    expect(ageBucket(0).key).toBe("week");
    expect(ageBucket(30).key).toBe("month");
    expect(ageBucket(45).key).toBe("two");
    expect(ageBucket(400).key).toBe("old");
  });
});
