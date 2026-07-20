import Link from "next/link";

export default function Home() {
  return (
    <main className="pt-24">
      {/* Hero Section */}
      <section className="relative min-h-230.25 flex items-center mb-8 px-8">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-primary-container blur-[120px]"></div>
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-primary blur-[120px]"></div>
        </div>
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 mt-16">
          <div className="lg:col-span-7">
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black font-headline leading-[0.85] tracking-tighter uppercase mb-8">
              Where
              <br />
              <span className="text-[#E31E24]">Creativity</span>
              <br />
              Belongs
            </h1>
            <p className="max-w-md text-lg text-on-surface-variant font-light leading-relaxed mb-10">
              Premium digital printing for those who demand precision. From
              industrial jerseys to bespoke ceramic art, we bring the urban
              pulse to every substrate.
            </p>
            <div className="flex gap-4">
              <Link
                href="/quote"
                className="bg-primary-container text-on-primary-container px-10 py-5 font-bold uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Start Project
              </Link>
              <Link
                href="/portfolio"
                className="border border-outline-variant/30 px-10 py-5 font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all"
              >
                View Gallery
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-3/4 bg-surface-container-high overflow-hidden">
                  <img
                    className="w-full h-full object-cover transition-all duration-500"
                    alt="Close up of high quality custom sublimated sports jersey"
                    src={`${process.env.NEXT_PUBLIC_CLOUDINARY_URL}/RHEIMS_BASKETBALL_JERSEY_o2ymc7`}
                  />
                </div>
                <div className="aspect-square bg-surface-container-high p-4 flex items-end">
                  <span className="font-headline text-4xl font-bold opacity-10">
                    EST. 2026
                  </span>
                </div>
              </div>
              <div className="pt-12 space-y-4">
                <div className="aspect-square bg-surface-container-high overflow-hidden">
                  <img
                    className="w-full h-full object-cover transition-all duration-500"
                    alt="Modern ceramic mug with professional digital print"
                    src={`${process.env.NEXT_PUBLIC_CLOUDINARY_URL}/VERDANT_mpfieg`}
                  />
                </div>
                <div className="aspect-3/4 bg-primary-container flex flex-col justify-center p-8">
                  <span className="material-symbols-outlined text-5xl mb-4 text-[#fffafa]">
                    print
                  </span>
                  <p className="font-headline font-bold text-xl uppercase leading-tight text-[#fffafa]">
                    Precision at Scale
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services - Bento Grid */}
      <section className="py-32 px-8 bg-surface-container-low">
        <div className="container mx-auto">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[#E31E24] font-headline font-bold uppercase tracking-[0.3em] text-sm block mb-4">
                Core Expertise
              </span>
              <h2 className="text-5xl md:text-7xl font-black font-headline uppercase leading-none">
                Our Services
              </h2>
            </div>
            <p className="max-w-xs text-on-surface-variant text-sm uppercase tracking-widest leading-relaxed">
              High-fidelity reproduction across diverse materials. Engineering
              art into tangible goods.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 group relative h-96 overflow-hidden bg-surface-container-high">
              <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10"></div>
              <div className="absolute bottom-8 left-8 z-20">
                <h3 className="text-3xl font-black font-headline uppercase">
                  T-Shirts
                </h3>
                <p className="text-on-surface-variant/80 text-sm font-bold tracking-widest uppercase">
                  Direct-to-Film
                </p>
              </div>
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                alt="T-shirts"
                src={`${process.env.NEXT_PUBLIC_CLOUDINARY_URL}/RHEIMS_VOLLEYBALL_MAIN_ff8ryl`}
              />
            </div>
            <div className="md:col-span-2 group relative h-96 overflow-hidden bg-surface-container-high">
              <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10"></div>
              <div className="absolute bottom-8 left-8 z-20">
                <h3 className="text-3xl font-black font-headline uppercase">
                  Mugs
                </h3>
              </div>
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                alt="Mugs"
                src={`${process.env.NEXT_PUBLIC_CLOUDINARY_URL}/CHARDONAY_obwsgp`}
              />
            </div>
            <div className="md:col-span-4 group relative h-120 overflow-hidden bg-surface-container-high">
              <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10"></div>
              <div className="absolute bottom-12 left-12 z-20">
                <h3 className="text-5xl font-black font-headline uppercase">
                  Full Sublimation Jerseys
                </h3>
                <p className="text-primary font-bold tracking-[0.4em] uppercase mt-2">
                  Professional Athletic Performance
                </p>
              </div>
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                alt="Jerseys"
                src={`${process.env.NEXT_PUBLIC_CLOUDINARY_URL}/WHITE_TIGERS_JERSEY_kts1sr`}
              />
            </div>
          </div>
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
            href="mailto:artinme03@gmail.com"
          >
            Inquire Now
          </a>
        </div>
      </section>
    </main>
  );
}
