"use client";

import Link from "next/link";
import { useRef } from "react";
import { CldImage } from "next-cloudinary";
import { motion, useScroll, useTransform } from "framer-motion";

import { LineReveal } from "@/components/motion/line-reveal";
import { EASE_PLATE, EASE_PRESS, Reveal } from "@/components/motion/reveal";
import { ArrowRight, RegistrationMark } from "@/components/motion/icons";

const SPECS = [
  { label: "Process", value: "DTF · Sublimation" },
  { label: "Run size", value: "One piece to bulk" },
  { label: "Pickup", value: "Brgy. Rizal, Silay" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Each sheet in the stack drifts at its own rate for a little depth.
  const backY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const frontY = useTransform(scrollYProgress, [0, 1], [0, 30]);

  return (
    <section
      ref={ref}
      className="relative mx-auto flex max-w-[1360px] flex-wrap items-center gap-14 px-4 pb-24 pt-32 md:px-6 md:pt-40"
    >
      <div
        aria-hidden
        className="halftone pointer-events-none absolute -right-28 top-10 h-[520px] w-[520px] opacity-35 [mask-image:radial-gradient(circle,#000_0%,transparent_68%)]"
      />

      <div className="relative min-w-0 flex-[1_1_560px]">
        <Reveal immediate delay={0.05} y={12}>
          <p className="spec mb-7 flex items-center gap-3 text-accent-ink">
            <motion.span
              className="inline-block h-0.5 w-10 origin-left bg-brand"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE_PRESS }}
            />
            № 01 — Digital print studio, Silay City
          </p>
        </Reveal>

        <LineReveal
          className="font-headline text-[clamp(3.5rem,9vw,9.25rem)] font-bold uppercase leading-[0.86] tracking-[-0.055em]"
          lines={[
            { text: "Where" },
            { text: "Creativity", className: "text-brand", misregister: true },
            { text: "Belongs." },
          ]}
          delay={0.15}
        />

        <Reveal immediate delay={0.6}>
          <p className="mt-9 max-w-[520px] text-lg font-light leading-relaxed text-on-surface-variant md:text-xl">
            Jerseys, shirts, mugs and tarpaulins, printed in-house by a family
            studio that sweats every ink droplet. Bring a sketch or a finished
            file. We take it to substrate.
          </p>
        </Reveal>

        <Reveal immediate delay={0.75} className="mt-10 flex flex-wrap gap-3.5">
          <Link
            href="/quote"
            className="ink-fill inline-flex min-h-15 items-center gap-3.5 bg-brand px-8 font-headline text-[15px] font-bold uppercase tracking-[0.14em] text-white"
          >
            Start a project
            <ArrowRight className="ink-arrow" />
          </Link>
          <Link
            href="/customizer"
            className="inline-flex min-h-15 items-center gap-3 border border-outline-variant px-7 font-headline text-[15px] font-bold uppercase tracking-[0.14em] transition-colors hover:border-on-surface hover:bg-surface-container-high"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M12 2l9 5v10l-9 5-9-5V7z" />
              <path d="M12 22V12M21 7l-9 5-9-5" />
            </svg>
            Design in 3D
          </Link>
        </Reveal>

        <Reveal immediate delay={0.9}>
          <dl className="mt-14 flex flex-wrap gap-10">
            {SPECS.map((s) => (
              <div key={s.label}>
                <dt className="spec text-[11px] text-on-surface-variant">{s.label}</dt>
                <dd className="mt-1.5 font-headline text-lg font-bold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      {/* Stacked proof sheets — the logo's offset-paper motif */}
      <Reveal immediate delay={0.35} className="relative h-[520px] min-w-0 flex-[1_1_400px] md:h-[600px]">
        <motion.div style={{ y: backY }} className="absolute left-[6%] top-[8%] h-[80%] w-[82%]">
          <div className="animate-drift-a h-full w-full border border-outline-variant/40 bg-[#0a0a0a]" />
        </motion.div>
        <motion.div style={{ y: midY }} className="absolute left-[12%] top-[5%] h-[80%] w-[80%]">
          <div className="animate-drift-b h-full w-full bg-brand" />
        </motion.div>
        <motion.figure
          style={{ y: frontY }}
          className="absolute left-[9%] top-[9%] m-0 h-[80%] w-[80%] bg-[#f4f1ec] p-3.5 shadow-[0_40px_80px_rgba(0,0,0,0.45)]"
        >
          <motion.div
            className="relative h-[calc(100%-44px)] w-full overflow-hidden bg-[#e5dfdb]"
            initial={{ clipPath: "inset(0 0 0 100%)" }}
            animate={{ clipPath: "inset(0 0 0 0%)" }}
            transition={{ duration: 1.2, delay: 0.6, ease: EASE_PLATE }}
          >
            <CldImage
              src="RHEIMS_BASKETBALL_JERSEY_o2ymc7"
              alt="Sublimated basketball jersey printed by Art 'n Me"
              width={900}
              height={1100}
              crop="fill"
              priority
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="h-full w-full object-cover"
            />
            <span
              aria-hidden
              className="absolute right-0 top-0 h-0 w-0 border-l-[72px] border-t-[72px] border-l-transparent border-t-brand"
            />
          </motion.div>
          <figcaption className="spec flex h-11 items-end justify-between text-[11px] text-[#3a3533]">
            <span>Proof 01 / Jersey run</span>
            <span>CMYK · 300 DPI</span>
          </figcaption>
        </motion.figure>

        {/* crop marks */}
        <span aria-hidden className="absolute left-[calc(9%-22px)] top-[calc(9%-22px)] h-4 w-4 border-b border-r border-on-surface-variant" />
        <span aria-hidden className="absolute left-[calc(89%+6px)] top-[calc(89%+6px)] h-4 w-4 border-l border-t border-on-surface-variant" />
        <RegistrationMark className="animate-spin-slow absolute right-0 top-0 h-16 w-16 text-on-surface" />

        <div className="absolute bottom-0 left-0 flex items-center gap-3.5 border border-outline-variant/40 bg-background px-4 py-3.5">
          <span className="relative h-2.5 w-2.5">
            <span className="absolute inset-0 bg-success" />
            <span className="animate-ping-square absolute inset-0 bg-success" />
          </span>
          <span className="spec text-on-surface-variant">Now taking orders</span>
        </div>
      </Reveal>
    </section>
  );
}
