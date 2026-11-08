import type { ProductType } from "@/db/schema";

// "Last charged" hints under an item's price: what the shop actually charged
// for this product before, so prices stay consistent between staff and
// repeat jobs. Pure, so the ranking is testable without a database.

export type PriceMemoryRow = {
  productType: ProductType;
  unitPrice: number;
  quantity: number;
  dimensions: string | null;
  orderNumber: number;
  /** ISO timestamp of the order. */
  createdAt: string;
  customerId: string;
};

export type PriceHint = PriceMemoryRow & { labels: ("this customer" | "similar qty")[] };

const MAX_HINTS = 3;

function similarQty(a: number, b: number) {
  return a >= b * 0.5 && a <= b * 2;
}

export function rankPriceMemory(
  rows: PriceMemoryRow[],
  { productType, quantity, customerId }: { productType: ProductType; quantity?: number; customerId?: string },
): PriceHint[] {
  const scored = rows
    .filter((r) => r.productType === productType)
    .map((r) => {
      const mine = !!customerId && r.customerId === customerId;
      const close = !!quantity && quantity > 0 && similarQty(r.quantity, quantity);
      const labels: PriceHint["labels"] = [];
      if (mine) labels.push("this customer");
      if (close) labels.push("similar qty");
      return { hint: { ...r, labels }, mine, close, time: Date.parse(r.createdAt) };
    })
    .sort(
      (a, b) =>
        Number(b.mine) - Number(a.mine) ||
        Number(b.close) - Number(a.close) ||
        b.time - a.time ||
        b.hint.orderNumber - a.hint.orderNumber,
    );

  const seen = new Set<string>();
  const hints: PriceHint[] = [];
  for (const { hint } of scored) {
    const key = `${hint.unitPrice}|${(hint.dimensions ?? "").trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hints.push(hint);
    if (hints.length === MAX_HINTS) break;
  }
  return hints;
}
