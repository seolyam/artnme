"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CldImage } from "next-cloudinary";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { EASE_PRESS } from "@/components/motion/reveal";
import { ArrowRight } from "@/components/motion/icons";
import { cn } from "@/lib/utils";

const ALL_CATEGORY = "All";
const PAGE_SIZE = 9;

// Varying tile heights give the masonry its rhythm.
const tileHeights = ["h-[420px]", "h-[300px]", "h-[360px]", "h-[480px]", "h-[340px]"];

type GalleryImage = {
  publicId: string;
  category: string;
  subcategory?: string;
};

type PortfolioGalleryProps = {
  images: GalleryImage[];
};

function toImageLabel(image: GalleryImage) {
  const filename = image.publicId.split("/").pop() ?? image.publicId;

  const words = filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/_(?=[a-z0-9]*\d)[a-z0-9]{6}$/, "") // Cloudinary's random suffix, e.g. _hwpjf4
    .split(/[-_\s]+/)
    // Drop export-tool tags and hash/UUID chunks that mean nothing to visitors.
    .filter((w) => w && !/^photoroom$/i.test(w) && !(/\d/.test(w) && /^[0-9a-f]{4,}$/i.test(w)));

  const label = words.join(" ").trim();
  return (label.length >= 2 ? label : image.subcategory ?? image.category).toUpperCase();
}

const pad = (n: number) => String(n).padStart(2, "0");

export function PortfolioGallery({ images }: PortfolioGalleryProps) {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const image of images) {
      counts.set(image.category, (counts.get(image.category) ?? 0) + 1);
    }
    return [
      { name: ALL_CATEGORY, count: images.length },
      ...Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    ];
  }, [images]);

  const subcategories = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return [];
    const unique = new Set(
      images
        .filter((img) => img.category === activeCategory && img.subcategory)
        .map((img) => img.subcategory as string),
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [images, activeCategory]);

  const filteredImages = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return images;
    return images.filter(
      (image) =>
        image.category === activeCategory &&
        (!activeSubcategory || image.subcategory === activeSubcategory),
    );
  }, [activeCategory, activeSubcategory, images]);

  const visibleImages = filteredImages.slice(0, visibleCount);

  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setActiveSubcategory(null);
    setVisibleCount(PAGE_SIZE);
  };

  const selectSubcategory = (subcategory: string | null) => {
    setActiveSubcategory(subcategory);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <>
      {/* Filter bar */}
      <div className="sticky top-0 z-30 border-y border-outline-variant/30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <div role="group" aria-label="Filter by process" className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = activeCategory === category.name;
              return (
                <button
                  key={category.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectCategory(category.name)}
                  className={cn(
                    "relative min-h-11 border px-5 font-headline text-xs font-bold uppercase tracking-[0.14em] transition-colors",
                    active
                      ? "border-brand text-white"
                      : "border-outline-variant/60 text-on-surface hover:border-on-surface",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="gallery-filter"
                      className="absolute inset-0 bg-brand"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span className="relative">
                    {category.name}
                    <span className={cn("spec ml-2 text-[11px]", active ? "text-white/80" : "text-on-surface-variant")}>
                      {pad(category.count)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <span className="spec text-on-surface-variant" aria-live="polite">
            Showing {pad(visibleImages.length)} of {pad(filteredImages.length)}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {subcategories.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE_PRESS }}
              className="overflow-hidden border-t border-outline-variant/20"
            >
              <div
                role="group"
                aria-label={`Filter ${activeCategory}`}
                className="mx-auto flex max-w-[1360px] flex-wrap gap-2 px-4 py-3 md:px-6"
              >
                {[null, ...subcategories].map((sub) => {
                  const active = activeSubcategory === sub;
                  return (
                    <button
                      key={sub ?? "all"}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectSubcategory(sub)}
                      className={cn(
                        "spec min-h-9 px-3.5 text-[11px] transition-colors",
                        active
                          ? "bg-surface-container-high text-accent-ink"
                          : "text-on-surface-variant hover:text-on-surface",
                      )}
                    >
                      {sub ?? `All ${activeCategory}`}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="mx-auto max-w-[1360px] px-4 pb-32 pt-10 md:px-6">
        {filteredImages.length === 0 ? (
          <div className="halftone flex min-h-80 flex-col items-center justify-center gap-3 bg-surface-container-low p-10 text-center [--dot:var(--outline-variant)]">
            <p className="bg-background px-4 py-2 font-headline text-2xl font-bold uppercase">
              No showcase images found
            </p>
            <p className="spec bg-background px-3 py-2 text-on-surface-variant">
              Add images to the Cloudinary folder showcase/ to fill this gallery
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleImages.map((image, index) => (
                <motion.button
                  key={image.publicId}
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  aria-label={`Open ${toImageLabel(image)}`}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.5, delay: (index % PAGE_SIZE) * 0.04, ease: EASE_PRESS }}
                  className={cn(
                    "group relative mb-4 block w-full cursor-zoom-in break-inside-avoid overflow-hidden bg-surface-container-high text-left",
                    tileHeights[index % tileHeights.length],
                  )}
                >
                  <CldImage
                    src={image.publicId}
                    alt={`${image.category} ${toImageLabel(image)}`}
                    width={700}
                    height={900}
                    crop="fill"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-full w-full object-cover transition-transform duration-[900ms] ease-[var(--ease-press)] group-hover:scale-[1.07]"
                  />
                  <span
                    aria-hidden
                    className="absolute right-0 top-0 h-0 w-0 border-l-0 border-t-0 border-l-transparent border-t-brand transition-[border-width] duration-500 ease-[var(--ease-press)] group-hover:border-l-[56px] group-hover:border-t-[56px]"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent" />
                  <span className="absolute inset-x-5 bottom-4 flex translate-y-2 flex-col gap-1.5 opacity-90 transition-[transform,opacity] duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="spec text-[11px] text-[#ff5a5f]">
                      {image.subcategory ? `${image.category} · ${image.subcategory}` : image.category}
                    </span>
                    <span className="font-headline text-xl font-bold uppercase tracking-tight text-white">
                      {toImageLabel(image)}
                    </span>
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredImages.length > visibleCount && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="min-h-14 border border-outline-variant px-9 font-headline text-sm font-bold uppercase tracking-[0.14em] transition-colors hover:border-brand hover:bg-brand hover:text-white"
            >
              Load more work
            </button>
          </div>
        )}
      </section>

      <Lightbox
        images={visibleImages}
        index={openIndex}
        onChange={setOpenIndex}
      />
    </>
  );
}

function Lightbox({
  images,
  index,
  onChange,
}: {
  images: GalleryImage[];
  index: number | null;
  onChange: (index: number | null) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  // False on the server, true in the browser — gates the body portal.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const open = index !== null && images[index] !== undefined;
  const count = images.length;

  const step = useCallback(
    (dir: number) => {
      if (index === null) return;
      onChange((index + dir + count) % count);
    },
    [index, count, onChange],
  );

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [open, onChange, step]);

  const image = open ? images[index] : null;

  if (!mounted) return null;

  // Portaled so the page-transition transform never traps `position: fixed`.
  return createPortal(
    <AnimatePresence>
      {image && index !== null && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={toImageLabel(image)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] flex flex-col bg-black/95 text-white"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
            <span className="spec text-white/75">
              {pad(index + 1)} / {pad(count)} · {image.category}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => onChange(null)}
              aria-label="Close"
              className="flex h-12 w-12 items-center justify-center border border-white/30 transition-colors hover:border-brand hover:bg-brand"
            >
              <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center gap-3 px-3 md:gap-4 md:px-6">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous piece"
              className="hidden h-14 w-14 shrink-0 items-center justify-center border border-white/30 transition-colors hover:border-brand hover:bg-brand sm:flex"
            >
              <ArrowRight className="rotate-180" />
            </button>
            <div className="relative h-full max-h-[75vh] w-full max-w-5xl">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={image.publicId}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: EASE_PRESS }}
                  className="absolute inset-0"
                >
                  <CldImage
                    src={image.publicId}
                    alt={`${image.category} ${toImageLabel(image)}`}
                    width={1600}
                    height={1600}
                    sizes="90vw"
                    className="h-full w-full object-contain"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next piece"
              className="hidden h-14 w-14 shrink-0 items-center justify-center border border-white/30 transition-colors hover:border-brand hover:bg-brand sm:flex"
            >
              <ArrowRight />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-6">
            <div className="flex gap-2 sm:hidden">
              <button type="button" onClick={() => step(-1)} aria-label="Previous piece" className="flex h-12 w-12 items-center justify-center border border-white/30">
                <ArrowRight className="rotate-180" />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next piece" className="flex h-12 w-12 items-center justify-center border border-white/30">
                <ArrowRight />
              </button>
            </div>
            <p className="font-headline text-2xl font-bold uppercase tracking-tight md:text-3xl">
              {toImageLabel(image)}
            </p>
            <Link
              href="/quote"
              className="ink-fill inline-flex min-h-12 items-center gap-3 bg-brand px-6 font-headline text-xs font-bold uppercase tracking-[0.14em] text-white"
            >
              Order something like this
              <ArrowRight className="ink-arrow h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
