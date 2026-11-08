import { describe, expect, it } from "vitest";
import { buildApplyPayload, type ApplyTarget } from "./apply";

const order: ApplyTarget = {
  customerId: "11111111-1111-4111-8111-111111111111",
  title: "Web quote — 50× T-Shirt",
  status: "Pending",
  totalAmount: "0.00",
  depositAmount: "0.00",
  dueDate: new Date("2026-11-13T09:00:00Z"), // 17:00 in Manila
  items: [
    {
      description: "Front print, white shirts\nContact: 0917 000 0001 · ana@example.com\nNeeded by: Fri Nov 13 2026",
    },
  ],
};

const items = [
  { productType: "T-Shirt" as const, description: "DTF front print", quantity: 50, dimensions: "", unitPrice: 350 },
  { productType: "Tarpaulin" as const, description: "", quantity: 1, dimensions: "3x5", unitPrice: 225 },
];

describe("buildApplyPayload", () => {
  it("sets the total from the items when none was entered", () => {
    expect(buildApplyPayload(order, items).totalAmount).toBe(50 * 350 + 225);
  });

  it("never overwrites a total staff already entered", () => {
    expect(buildApplyPayload({ ...order, totalAmount: "15000.00" }, items).totalAmount).toBe(15000);
  });

  it("keeps the order's other fields as they are", () => {
    const p = buildApplyPayload({ ...order, depositAmount: "500.00" }, items);
    expect(p).toMatchObject({
      customerId: order.customerId,
      title: order.title,
      status: "Pending",
      depositAmount: 500,
      dueDate: "2026-11-13T17:00",
    });
  });

  it("uses the draft's due date only when the order has none", () => {
    expect(buildApplyPayload(order, items, "2026-11-20T17:00").dueDate).toBe("2026-11-13T17:00");
    expect(buildApplyPayload({ ...order, dueDate: null }, items, "2026-11-20T17:00").dueDate).toBe("2026-11-20T17:00");
    expect(buildApplyPayload({ ...order, dueDate: null }, items).dueDate).toBe("");
  });

  it("replaces the items and keeps the customer's original request on the first one", () => {
    const p = buildApplyPayload(order, items);
    expect(p.items).toHaveLength(2);
    expect(p.items.every((it) => !("id" in it))).toBe(true);
    expect(p.items[0].description).toBe(
      "DTF front print\n\nFrom the request:\nFront print, white shirts\nContact: 0917 000 0001 · ana@example.com\nNeeded by: Fri Nov 13 2026",
    );
    expect(p.items[1]).toEqual(items[1]);
  });
});
