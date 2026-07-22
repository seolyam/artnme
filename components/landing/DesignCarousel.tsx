"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CldImage } from "next-cloudinary";
import { useCallback, useEffect, useState } from "react";

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

export function DesignCarousel({
  images,
  intervalMs = 4500,
}: DesignCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
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

  const goNext = useCallback(() => go(index + 1, 1), [go, index]);
  const goPrev = useCallback(() => go(index - 1, -1), [go, index]);

  useEffect(() => {
    if (paused || count <= 1) return;

    const timer = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % count);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [paused, count, intervalMs]);

  if (count === 0) {
    return (
      <div className="flex h-96 items-center justify-center bg-surface-container-high text-sm uppercase tracking-widest text-on-surface-variant">
        No showcase images yet.
      </div>
    );
  }

  const current = images[index];

  return (
    <div
      className="group relative overflow-hidden bg-surface-container-high"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-16/10 w-full md:aspect-21/9">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current.publicId}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0"
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
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 left-0 z-20 p-6 md:p-10">
        <p className="font-headline text-xs font-bold uppercase tracking-[0.3em] text-primary-container">
          {current.subcategory
            ? `${current.category} - ${current.subcategory}`
            : current.category}
        </p>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className={cn(
              "absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-on-surface backdrop-blur-sm transition-all hover:bg-background hover:scale-110",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
            )}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className={cn(
              "absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-on-surface backdrop-blur-sm transition-all hover:bg-background hover:scale-110",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
            )}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          <div className="absolute bottom-4 right-6 z-20 flex gap-2 md:bottom-6 md:right-10">
            {images.map((image, i) => (
              <button
                key={image.publicId}
                type="button"
                onClick={() => go(i, i > index ? 1 : -1)}
                aria-label={`Go to image ${i + 1}`}
                className={cn(
                  "h-2 transition-all",
                  i === index
                    ? "w-8 bg-primary-container"
                    : "w-2 bg-on-surface/40 hover:bg-on-surface/70",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}