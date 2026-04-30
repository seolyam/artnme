import { PortfolioGallery } from "@/components/portfolio/Gallery";
import { getShowcaseImages } from "@/lib/cloudinary";

export default async function PortfolioPage() {
  const showcaseImages = await getShowcaseImages();

  return (
    <main className="pt-24">
      <section className="relative overflow-hidden bg-surface px-8 py-24">
        <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
          <div className="absolute -left-10 top-8 h-56 w-56 bg-primary-container blur-[100px]" />
          <div className="absolute -right-10 bottom-8 h-56 w-56 bg-surface-container-highest blur-[100px]" />
        </div>

        <div className="container relative z-10 mx-auto">
          <span className="mb-6 block text-sm font-headline font-bold uppercase tracking-[0.3em] text-primary-container">
            Portfolio
          </span>
          <h1 className="max-w-5xl font-headline text-5xl font-black uppercase leading-none tracking-tight md:text-7xl lg:text-8xl">
            Real Client Work,
            <br />
            Studio-Grade Output
          </h1>
          <p className="mt-6 max-w-2xl text-sm uppercase tracking-widest text-on-surface-variant">
            Browse the showcase by print process. Every item below comes from
            real production batches from Art &apos;n Me.
          </p>
        </div>
      </section>

      <PortfolioGallery images={showcaseImages} />
    </main>
  );
}
