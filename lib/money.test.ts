import { describe, expect, it } from "vitest";
import { balanceOf, peso, roundMoney, toNumber } from "./money";

describe("money", () => {
  it("toNumber reads Postgres numeric strings and guards junk", () => {
    expect(toNumber("1234.50")).toBe(1234.5);
    expect(toNumber(7)).toBe(7);
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber("abc")).toBe(0);
  });

  it("roundMoney removes float noise", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(19.999)).toBe(20);
    expect(roundMoney(2.675)).toBeCloseTo(2.68, 1);
  });

  it("peso formats with and without centavos", () => {
    expect(peso(1234.5)).toBe("₱1,234.50");
    expect(peso("0")).toBe("₱0.00");
    expect(peso(1234.5, false)).toBe("₱1,234.5");
    expect(peso(1000, false)).toBe("₱1,000");
  });

  it("balanceOf is total minus paid, rounded", () => {
    expect(balanceOf({ totalAmount: "450.00", depositAmount: "225.00" })).toBe(225);
    expect(balanceOf({ totalAmount: "0.30", depositAmount: "0.10" })).toBe(0.2);
    expect(balanceOf({ totalAmount: "100", depositAmount: "100" })).toBe(0);
  });
});
