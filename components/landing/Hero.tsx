"use client";

import Link from "next/link";
import { CldImage } from "next-cloudinary";

export function Hero() {
  return (
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
              <div className="aspect-3/4 bg-surface-container-high overflow-hidden relative">
                <CldImage
                  className="w-full h-full object-cover transition-all duration-500"
                  alt="Close up of high quality custom sublimated sports jersey"
                  src="RHEIMS_BASKETBALL_JERSEY_o2ymc7"
                  width={800}
                  height={1067}
                />
              </div>
              <div className="aspect-square bg-surface-container-high p-4 flex items-end">
                <span className="font-headline text-4xl font-bold opacity-10">
                  EST. 2026
                </span>
              </div>
            </div>
            <div className="pt-12 space-y-4">
              <div className="aspect-square bg-surface-container-high overflow-hidden relative">
                <CldImage
                  className="w-full h-full object-cover transition-all duration-500"
                  alt="Modern ceramic mug with professional digital print"
                  src="VERDANT_mpfieg"
                  width={800}
                  height={800}
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
  );
}