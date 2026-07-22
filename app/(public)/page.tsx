import { Hero } from "@/components/landing/Hero";
import { DesignCarousel } from "@/components/landing/DesignCarousel";
import { getShowcaseImages } from "@/lib/cloudinary";

export default async function Home() {
  const showcaseImages = await getShowcaseImages();

  const tshirtImages = showcaseImages.filter(
    (image) =>
      image.category.includes("T-SHIRT") || image.category.includes("TSHIRT"),
  );
  const pool = tshirtImages.length > 0 ? tshirtImages : showcaseImages;
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);

  return (
    <main className="pt-24">
      <Hero />

      {/* Design Showcase Carousel */}
      <section className="py-32 px-8 bg-surface-container-low">
        <div className="container mx-auto">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[#E31E24] font-headline font-bold uppercase tracking-[0.3em] text-sm block mb-4">
                Fresh Off The Press
              </span>
              <h2 className="text-5xl md:text-7xl font-black font-headline uppercase leading-none">
                Design Showcase
              </h2>
            </div>
            <p className="max-w-xs text-on-surface-variant text-sm uppercase tracking-widest leading-relaxed">
              A rotating look at recent t-shirt designs straight from the
              studio. See the full archive in the gallery.
            </p>
          </div>
          <DesignCarousel images={shuffled} />
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 px-8">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="space-y-6">
            <div className="w-16 h-1 bg-[#E31E24] mb-12"></div>
            <span className="material-symbols-outlined text-[#E31E24] text-5xl">
              bolt
            </span>
            <h3 className="text-3xl font-black font-headline uppercase">
              Fast Turnaround
            </h3>
            <p className="text-on-surface-variant leading-relaxed font-light">
              We value your time as much as your vision. Our optimized
              industrial workflow ensures rapid delivery without compromising on
              a single ink droplet.
            </p>
          </div>
          <div className="space-y-6">
            <div className="w-16 h-1 bg-[#E31E24] mb-12"></div>
            <span className="material-symbols-outlined text-[#E31E24] text-5xl">
              palette
            </span>
            <h3 className="text-3xl font-black font-headline uppercase">
              Quality Ink
            </h3>
            <p className="text-on-surface-variant leading-relaxed font-light">
              Using only industrial-grade CMYK formulations that resist fading
              and wash-out. Your colors remain as vibrant as the day they were
              printed.
            </p>
          </div>
          <div className="space-y-6">
            <div className="w-16 h-1 bg-[#E31E24] mb-12"></div>
            <span className="material-symbols-outlined text-[#E31E24] text-5xl">
              groups
            </span>
            <h3 className="text-3xl font-black font-headline uppercase">
              Family Business
            </h3>
            <p className="text-on-surface-variant leading-relaxed font-light">
              Rooted in Silay City, we treat every project like it&apos;s for our own
              family. Personalized service meets professional-grade digital
              results.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#E31E24] opacity-5"></div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-7xl font-black font-headline uppercase mb-8">
            Ready to print your vision?
          </h2>
          <p className="max-w-2xl mx-auto text-on-surface-variant text-lg font-light mb-12">
            Whether it&apos;s a single mug or a thousand jerseys, we bring the same
            industrial precision to every project. Let&apos;s make it real.
          </p>
          <a
            className="inline-block bg-primary-container text-on-primary-container px-16 py-6 font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all"
            href="https://www.facebook.com/ArtnMeOfficial/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Inquire Now
          </a>
        </div>
      </section>
    </main>
  );
}