"use client";

import { cn } from "@/lib/utils";

export interface PrintColor {
  name: string;
  hex: string;
}

export const PRINT_COLORS: PrintColor[] = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#0A0A0A" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Red", hex: "#B31218" },
  { name: "Ash", hex: "#9B9B9B" },
  { name: "Olive", hex: "#4A5320" },
  { name: "Heather", hex: "#B8B5B0" },
  { name: "Gold", hex: "#C9A227" },
];

interface SwatchChipProps {
  selected: string;
  onSelect: (hex: string) => void;
}

export function SwatchChip({ selected, onSelect }: SwatchChipProps) {
  return (
    <div
      className="flex flex-wrap gap-3"
      role="radiogroup"
      aria-label="Shirt base color"
    >
      {PRINT_COLORS.map((color) => {
        const isActive =
          selected.toLowerCase() === color.hex.toLowerCase();
        return (
          <button
            key={color.name}
            type="button"
            onClick={() => onSelect(color.hex)}
            title={color.name}
            aria-label={color.name}
            role="radio"
            aria-checked={isActive}
            className={cn(
              "group relative h-11 w-11 transition-transform duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive && "scale-110",
            )}
          >
            <span
              className={cn(
                "block h-full w-full border transition-colors",
                isActive
                  ? "border-primary-container ring-2 ring-primary-container ring-offset-2 ring-offset-background"
                  : "border-outline-variant/30 group-hover:border-outline-variant",
              )}
              style={{ backgroundColor: color.hex }}
            />
            <span
              className={cn(
                "pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest font-headline text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100",
                isActive && "opacity-100 text-primary-container",
              )}
            >
              {color.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
