import { roundMoney } from "@/lib/money";

export type Size = { width: number; height: number; unit: "ft"; sqft: number };

const UNIT_TO_FT: Record<string, number> = {
  ft: 1,
  feet: 1,
  foot: 1,
  "'": 1,
  in: 1 / 12,
  inch: 1 / 12,
  inches: 1 / 12,
  '"': 1 / 12,
  m: 3.28084,
  cm: 1 / 30.48,
};

const NUM = String.raw`(\d+(?:\.\d+)?)`;
const UNIT = String.raw`(ft|feet|foot|inches|inch|in|cm|m|'|")?`;
const SIZE = new RegExp(String.raw`^${NUM}\s*${UNIT}\s*(?:x|×|by|\*)\s*${NUM}\s*${UNIT}$`, "i");

/**
 * Read a tarpaulin size the way staff type it: "3x5", "3 x 5 ft", "3ft x 5ft",
 * "36 x 60 in", "1 by 2 m", "3'x5'". Feet unless a unit says otherwise; a unit
 * on only one side applies to both. Returns the size in feet and its area.
 */
export function parseSize(input: string | null | undefined): Size | null {
  const text = (input ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const m = text.match(SIZE);
  if (!m) return null;
  const [, w, wUnit, h, hUnit] = m;
  const unitW = UNIT_TO_FT[wUnit ?? hUnit ?? "ft"];
  const unitH = UNIT_TO_FT[hUnit ?? wUnit ?? "ft"];
  const width = Number(w) * unitW;
  const height = Number(h) * unitH;
  if (!(width > 0) || !(height > 0)) return null;
  return {
    width: Math.round(width * 100) / 100,
    height: Math.round(height * 100) / 100,
    unit: "ft",
    sqft: Math.round(width * height * 100) / 100,
  };
}

/** Price of one tarpaulin: area × rate per square foot, to the centavo. */
export function priceBySize(size: Size, ratePerSqft: number) {
  return roundMoney(size.sqft * ratePerSqft);
}

/** "3 × 5 ft = 15 sq ft" */
export function describeSize(size: Size) {
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""));
  return `${fmt(size.width)} × ${fmt(size.height)} ft = ${fmt(size.sqft)} sq ft`;
}
