"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CldImage } from "next-cloudinary";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ALL_CATEGORY = "All";

const tileAspects = [
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[5/4]",
];

type GalleryImage = {
  publicId: string;
  category: string;
  subcategory?: string;
};

type PortfolioGalleryProps = {
  images: GalleryImage[];
};

function toImageLabel(publicId: string) {
  const filename = publicId.split("/").pop() ?? publicId;

  return filename
    .replace(/[-_]+/g, " ")
    .replace(/\.[a-z0-9]+$/i, "")
    .trim()
    .toUpperCase();
}

export function PortfolioGallery({ images }: PortfolioGalleryProps) {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(images.map((image) => image.category)));

    return [ALL_CATEGORY, ...unique.sort((a, b) => a.localeCompare(b))];
  }, [images]);

  const subcategories = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return [];

    const relevantImages = images.filter(
      (img) => img.category === activeCategory && img.subcategory,
    );
    const unique = Array.from(
      new Set(relevantImages.map((image) => image.subcategory as string)),
    );

    return unique.sort((a, b) => a.localeCompare(b));
  }, [images, activeCategory]);

  const filteredImages = useMemo(() => {
    let filtered = images;
    if (activeCategory !== ALL_CATEGORY) {
      filtered = filtered.filter((image) => image.category === activeCategory);
      if (activeSubcategory) {
        filtered = filtered.filter(
          (image) => image.subcategory === activeSubcategory,
        );
      }
    }
    return filtered;
  }, [activeCategory, activeSubcategory, images]);

  const paginatedImages = useMemo(() => {
    return filteredImages.slice(0, visibleCount);
  }, [filteredImages, visibleCount]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setActiveSubcategory(null);
    setVisibleCount(6);
  };

  const handleSubcategoryChange = (subcategory: string | null) => {
    setActiveSubcategory(subcategory);
    setVisibleCount(6);
  };

  return (
    <section className="bg-surface-container-low px-8 py-32">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-4 block text-sm font-headline font-bold uppercase tracking-[0.3em] text-primary-container">
              Portfolio
            </span>
            <h2 className="font-headline text-5xl font-black uppercase leading-none md:text-7xl">
              Showcase Archive
            </h2>
          </div>
          <p className="max-w-sm text-sm uppercase tracking-widest text-on-surface-variant">
            Real production outputs from the studio. Filter by print process and
            explore each batch in detail.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap gap-3">
          {categories.map((category) => {
            const isActive = activeCategory === category;

            return (
              <Button
                key={category}
                type="button"
                variant="ghost"
                onClick={() => handleCategoryChange(category)}
                className={cn(
                  "h-auto rounded-none border-0 px-5 py-2 font-headline text-xs font-bold uppercase tracking-[0.2em]",
                  isActive
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container-highest text-on-surface hover:bg-surface-container",
                )}
              >
                {category}
              </Button>
            );
          })}
        </div>

        {subcategories.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2 pl-4 border-l-2 border-primary-container/30">
            <Button
              variant="ghost"
              onClick={() => handleSubcategoryChange(null)}
              className={cn(
                "h-auto rounded-none border-0 px-4 py-1.5 font-headline text-[10px] font-bold uppercase tracking-[0.2em]",
                activeSubcategory === null
                  ? "bg-surface-container-high text-primary-container"
                  : "bg-transparent text-on-surface hover:bg-surface-container",
              )}
            >
              ALL {activeCategory}
            </Button>
            {subcategories.map((subcat) => {
              const isActive = activeSubcategory === subcat;

              return (
                <Button
                  key={subcat}
                  type="button"
                  variant="ghost"
                  onClick={() => handleSubcategoryChange(subcat)}
                  className={cn(
                    "h-auto rounded-none border-0 px-4 py-1.5 font-headline text-[10px] font-bold uppercase tracking-[0.2em]",
                    isActive
                      ? "bg-surface-container-high text-primary-container"
                      : "bg-transparent text-on-surface hover:bg-surface-container",
                  )}
                >
                  {subcat}
                </Button>
              );
            })}
          </div>
        )}

        {filteredImages.length === 0 ? (
          <Card className="bg-surface-container-high p-10">
            <p className="font-headline text-2xl font-bold uppercase tracking-wide">
              No showcase images found.
            </p>
            <p className="text-sm uppercase tracking-widest text-on-surface-variant">
              Add images to the Cloudinary folder <strong>showcase/</strong> to
              populate this gallery.
            </p>
          </Card>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {paginatedImages.map((image, index) => (
                <motion.div
                  key={image.publicId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <Card className="group overflow-hidden bg-surface-container-highest/70 py-0">
                    <div
                      className={cn(
                        "relative overflow-hidden",
                        tileAspects[index % tileAspects.length],
                      )}
                    >
                      <CldImage
                        src={image.publicId}
                        alt={`${image.category} ${toImageLabel(image.publicId)}`}
                        width={600}
                        height={600}
                        crop="fill"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent opacity-75" />
                    </div>

                    <div className="space-y-2 px-5 py-4">
                      <p className="font-headline text-xs font-bold uppercase tracking-[0.28em] text-primary-container">
                        {image.subcategory ? `${image.category} - ${image.subcategory}` : image.category}
                      </p>
                      <p className="font-body text-xs uppercase tracking-widest text-on-surface-variant">
                        {toImageLabel(image.publicId)}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredImages.length > visibleCount && (
          <div className="mt-16 flex justify-center">
            <Button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="bg-primary-container text-on-primary-container font-headline font-bold uppercase tracking-widest hover:brightness-110 px-8 py-6 rounded-none text-xs"
            >
              Show More
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
