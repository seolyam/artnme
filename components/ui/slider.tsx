"use client";

import * as React from "react";
import { Slider } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * Themed Slider (Stitch "Curated Press" design tokens — sharp corners,
 * primary-container fill). Built on Radix Slider via the `radix-ui` umbrella
 * package instead of a native <input type="range">.
 */
function SliderRoot({
  className,
  defaultValue,
  value,
  onValueChange,
  ...props
}: React.ComponentProps<typeof Slider.Root>) {
  const thumbCount = (value ?? defaultValue ?? [0]).length;
  return (
    <Slider.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn(
        "relative flex h-5 w-full touch-none select-none items-center",
        className,
      )}
      {...props}
    >
      <Slider.Track
        data-slot="slider-track"
        className="relative h-1 w-full grow overflow-hidden bg-surface-container-highest dark:bg-white/10"
      >
        <Slider.Range
          data-slot="slider-range"
          className="absolute h-full bg-primary-container"
        />
      </Slider.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <Slider.Thumb
          data-slot="slider-thumb"
          key={i}
          className="block size-4 shrink-0 border border-outline-variant/40 bg-surface-lowest shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </Slider.Root>
  );
}

export { SliderRoot as Slider };