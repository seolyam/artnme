"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CldImage } from "next-cloudinary";
import { useCallback, useEffect, useState } from "react";

import { EASE_PLATE, EASE_PRESS } from "@/components/motion/reveal";
import { ArrowRight } from "@/components/motion/icons";
import { cn } from "@/lib/utils";

type CarouselImage = {
  publicId: string;
  category: string;
  subcategory?: string;
};

type DesignCarouselProps = {
  images: CarouselImage[];
  intervalMs?: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function DesignCarousel({ images, intervalMs = 5000 }: DesignCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  const go = useCallback(
    (next: number, dir: number) => {
      if (count === 0) return;
      setDirection(dir);
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setTimeout(() => go(index + 1, 1), intervalMs);
    return () => clearTimeout(timer);
  }, [paused, count, intervalMs, index, go]);

  if (count === 0) {
    return (
      <div className="halftone flex h-96 items-center justify-center bg-surface-container-high [--dot:var(--outline-variant)]">
        <p className="spec bg-background px-4 py-3 text-on-surface-variant">
          No showcase images yet
        </p>
      </div>
    );
  }

  const current = images[index];
  const label = current.subcategory
    ? `${current.category} · ${current.subcategory}`
    : current.category;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mb-6 flex items-center justify-end gap-2.5">
        <p className="spec mr-3 text-sm" aria-live="polite">
          <span className="text-on-surface">{pad(index + 1)}</span>
          <span className="text-on-surface-variant"> / {pad(count)}</span>
        </p>
        <button
          type="button"
          onClick={() => go(index - 1, -1)}
          aria-label="Previous design"
          disabled={count <= 1}
          className="flex h-14 w-14 items-center justify-center border border-outline-variant text-on-surface transition-colors hover:border-brand hover:bg-brand hover:text-white disabled:opacity-40"
        >
          <ArrowRight className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1, 1)}
          aria-label="Next design"
          disabled={count <= 1}
          className="flex h-14 w-14 items-center justify-center border border-outline-variant text-on-surface transition-colors hover:border-brand hover:bg-brand hover:text-white disabled:opacity-40"
        >
          <ArrowRight />
        </button>
      </div>

      <div className="relative aspect-4/5 w-full overflow-hidden bg-surface-container-high sm:aspect-16/10 md:aspect-21/9">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={current.publicId}
            custom={direction}
            initial={{
              clipPath: direction > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)",
            }}
            animate={{ clipPath: "inset(0 0% 0 0%)" }}
            exit={{ opacity: 0.4 }}
            transition={{ duration: 0.9, ease: EASE_PLATE }}
            className="absolute inset-0"
          >
            <motion.div
              className="h-full w-full"
              initial={{ scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.6, ease: EASE_PRESS }}
            >
              <CldImage
                src={current.publicId}
                alt={`${current.category} design showcase`}
                width={1600}
                height={900}
                crop="fill"
                sizes="100vw"
                className="h-full w-full object-cover"
              />
            </motion.div>
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />
            <motion.div
              className="absolute bottom-0 left-0 p-6 md:p-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: EASE_PRESS }}
            >
              <p className="spec text-[#ff5a5f]">{label}</p>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <div className="absolute inset-x-0 bottom-0 z-10 h-1 bg-white/15">
            <motion.div
              key={`${index}-${paused}`}
              className={cn("h-full origin-left bg-brand")}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: paused ? 0 : 1 }}
              transition={{ duration: paused ? 0.2 : intervalMs / 1000, ease: "linear" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
