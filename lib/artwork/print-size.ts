import type { ProductType } from "@/db/schema";
import { parseSize } from "@/lib/pricing";

// Will this image print sharp? Pure math, free and instant: pixels across the
// print area = dots per inch. Starting values; confirm with the shop's designer.

type Area = { width: number; height: number };
export type Verdict = "good" | "okay" | "low";

const SHIRT_FRONT: Area = { width: 11, height: 14 };
const DEFAULT_TARP: Area = { width: 36, height: 60 }; // 3x5 ft

export const PRINT_AREAS: Partial<Record<ProductType, Area>> = {
  "T-Shirt": SHIRT_FRONT,
  Polo: SHIRT_FRONT,
  "Chinese Collar": SHIRT_FRONT,
  Mug: { width: 8, height: 3.25 },
  "Button Pins": { width: 2.25, height: 2.25 },
  "Jersey Upper": { width: 20, height: 28 },
  "Jersey Set": { width: 20, height: 28 },
};

// Tarps are seen from meters away, so far fewer dots per inch look sharp.
const THRESHOLDS: { tarp: { good: number; okay: number }; other: { good: number; okay: number } } = {
  tarp: { good: 50, okay: 50 },
  other: { good: 150, okay: 100 },
};

/** Print area in inches; a tarpaulin's comes from its size (default 3x5 ft). */
export function printAreaFor(productType: ProductType, dimensions?: string | null): Area {
  if (productType === "Tarpaulin") {
    const size = parseSize(dimensions);
    return size ? { width: Math.round(size.width * 12 * 100) / 100, height: Math.round(size.height * 12 * 100) / 100 } : DEFAULT_TARP;
  }
  return PRINT_AREAS[productType] ?? SHIRT_FRONT;
}

/** DPI when the image is scaled to fit the area. `rotate` lets the area turn
 *  to match the image's orientation (a tarp can hang either way). */
export function effectiveDpi(px: Area, area: Area, { rotate = false } = {}): number {
  let a = area;
  if (rotate && px.width >= px.height !== a.width >= a.height) a = { width: area.height, height: area.width };
  return Math.max(px.width / a.width, px.height / a.height);
}

export function verdict(dpi: number, productType: ProductType): Verdict {
  const t = productType === "Tarpaulin" ? THRESHOLDS.tarp : THRESHOLDS.other;
  if (dpi >= t.good) return "good";
  if (dpi >= t.okay) return "okay";
  return "low";
}

const NAME: Partial<Record<ProductType, string>> = {
  "T-Shirt": "shirt",
  Polo: "polo",
  "Chinese Collar": "shirt",
  Mug: "mug",
  "Button Pins": "button pin",
  "Jersey Upper": "jersey",
  "Jersey Set": "jersey",
  Tarpaulin: "tarpaulin",
};

/** A friendly note for the quote form, or null when it can't tell (PDFs). */
export function artworkHint({
  type,
  width,
  height,
  productType,
  dimensions,
}: {
  type: string;
  width?: number;
  height?: number;
  productType: ProductType;
  dimensions?: string | null;
}): { verdict: Verdict; message: string } | null {
  const name = NAME[productType] ?? "print";
  if (type === "image/svg+xml") return { verdict: "good", message: "Vector file: prints sharp at any size." };
  if (!type.startsWith("image/") || !width || !height) return null;

  const dpi = effectiveDpi({ width, height }, printAreaFor(productType, dimensions), { rotate: productType === "Tarpaulin" });
  const v = verdict(dpi, productType);
  const message =
    v === "good"
      ? `Looks sharp for a ${name} print.`
      : v === "okay"
        ? `Should print fine on a ${name}. A bigger original would be sharper.`
        : `This is ${width}×${height} px, so it may print blurry on a ${name}. Send the original file if you have it.`;
  return { verdict: v, message };
}
