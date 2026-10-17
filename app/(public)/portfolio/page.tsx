import { PortfolioGallery } from "@/components/portfolio/Gallery";
import { LineReveal } from "@/components/motion/line-reveal";
import { Reveal } from "@/components/motion/reveal";
import { getShowcaseImages } from "@/lib/cloudinary";

export const metadata = {
  title: "Portfolio — Art 'n Me",
  description: "Real production batches from Art 'n Me: jerseys, shirts, mugs and tarpaulins.",
};

// Re-read Cloudinary hourly so new showcase uploads appear without a redeploy.
export const revalidate = 3600;

export default async function PortfolioPage() {
  const showcaseImages = await getShowcaseImages();

  return (
    <main>
      <header className="relative mx-auto max-w-[1360px] overflow-hidden px-4 pb-16 pt-36 md:px-6 md:pt-44">
        <p
          aria-hidden
          className="text-outline pointer-events-none absolute -right-2 top-28 hidden font-headline text-[13rem] font-bold leading-[0.8] tracking-[-0.06em] text-outline-variant/50 lg:block"
        >
          {String(showcaseImages.length).padStart(2, "0")}
        </p>
        <Reveal immediate y={12}>
          <p className="spec mb-6 text-accent-ink">Portfolio — real production batches</p>
        </Reveal>
        <LineReveal
          className="relative font-headline text-[clamp(3.25rem,8vw,8rem)] font-bold uppercase leading-[0.86] tracking-[-0.055em]"
          lines={[
            { text: "Real client work." },
            { text: "Studio-grade output.", className: "text-brand" },
          ]}
        />
        <Reveal immediate delay={0.45}>
          <p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-on-surface-variant">
            Everything here came off our presses. Filter by process, then open any
            piece to see it up close.
          </p>
        </Reveal>
      </header>

      <PortfolioGallery images={showcaseImages} />
    </main>
  );
}
