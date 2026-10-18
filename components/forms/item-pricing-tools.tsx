"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Calculator } from "lucide-react";
import type { PricePresetView } from "@/app/actions/prices";
import type { OrderFormSchemaValues } from "@/lib/validators";
import { peso } from "@/lib/money";
import { describeSize, parseSize, priceBySize } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Under each item row: the price list for that product as one-tap buttons,
 * and for tarpaulins a size × rate calculator that fills in the price.
 */
export function ItemPricingTools({ index, presets }: { index: number; presets: PricePresetView[] }) {
  const { control, setValue } = useFormContext<OrderFormSchemaValues>();
  const item = useWatch({ control, name: `items.${index}` });
  const [rate, setRate] = useState("");
  const productType = item?.productType ?? "Other";
  const options = presets.filter((p) => p.productType === productType);
  const size = parseSize(item?.dimensions);
  const sqftOptions = options.filter((p) => p.unit === "sqft");
  const isTarp = productType === "Tarpaulin" || sqftOptions.length > 0;
  const rateNum = Number(rate);
  const unitPrice = Number(item?.unitPrice) || 0;

  function setPrice(value: number) {
    setValue(`items.${index}.unitPrice`, value, { shouldValidate: true, shouldDirty: true });
  }

  function pick(p: PricePresetView) {
    const price = Number(p.price);
    if (p.unit === "sqft") {
      setRate(String(price));
      if (size) setPrice(priceBySize(size, price));
    } else {
      setPrice(price);
    }
    // Put the price name into the details when they're empty, so the designer sees it.
    if (!item?.description) setValue(`items.${index}.description`, p.label, { shouldDirty: true });
  }

  if (options.length === 0 && !isTarp) return null;

  return (
    <div className="mt-3 space-y-2">
      {options.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="spec mr-1 text-[10px] text-on-surface-variant">Price list</span>
          {options.map((p) => {
            const active =
              p.unit === "piece" ? Math.abs(unitPrice - Number(p.price)) < 0.005 : rate !== "" && Number(rate) === Number(p.price);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p)}
                aria-pressed={active}
                className={cn(
                  "min-h-9 border px-3 text-xs font-semibold transition-colors",
                  active ? "border-on-surface bg-on-surface text-surface" : "border-outline-variant/60 hover:border-on-surface-variant",
                )}
              >
                {p.label} · {peso(p.price, false)}
                {p.unit === "sqft" ? "/sq ft" : ""}
              </button>
            );
          })}
        </div>
      )}

      {isTarp && (
        <div className="flex flex-wrap items-center gap-2 bg-surface-container-low px-3 py-2 text-sm">
          <Calculator className="h-4 w-4 shrink-0 text-on-surface-variant" />
          {size ? (
            <span className="font-medium">{describeSize(size)}</span>
          ) : (
            <span className="text-on-surface-variant">Type the size above (e.g. 3x5) to work out the price.</span>
          )}
          <label className="flex items-center gap-1.5">
            <span className="text-on-surface-variant">×</span>
            <span className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">₱</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="rate"
                aria-label="Price per square foot"
                className="h-9 w-24 border border-outline-variant/60 bg-surface-container-lowest pl-5 pr-1 font-mono text-sm outline-none focus:border-on-surface-variant"
              />
            </span>
            <span className="text-on-surface-variant">/ sq ft</span>
          </label>
          {size && rateNum > 0 && (
            <button
              type="button"
              onClick={() => setPrice(priceBySize(size, rateNum))}
              className="ml-auto min-h-9 bg-on-surface px-3 text-xs font-semibold text-surface"
            >
              Use {peso(priceBySize(size, rateNum))} each
            </button>
          )}
        </div>
      )}
    </div>
  );
}
