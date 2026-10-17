import Link from "next/link";

import { LineReveal } from "@/components/motion/line-reveal";
import { Reveal } from "@/components/motion/reveal";
import { ArrowRight, RegistrationMark } from "@/components/motion/icons";

export default function NotFound() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-[1360px] flex-col justify-center overflow-hidden px-4 py-40 md:px-6">
      <div
        aria-hidden
        className="halftone pointer-events-none absolute -right-24 top-1/4 h-[480px] w-[480px] opacity-30 [mask-image:radial-gradient(circle,#000_0%,transparent_68%)]"
      />
      <RegistrationMark className="animate-spin-slow absolute right-8 top-32 h-16 w-16 text-on-surface-variant" />
      <Reveal immediate y={12}>
        <p className="spec mb-6 text-accent-ink">Error 404 · Misprint</p>
      </Reveal>
      <LineReveal
        className="font-headline text-[clamp(6rem,22vw,20rem)] font-bold uppercase leading-[0.8] tracking-[-0.07em]"
        lines={[{ text: "404", misregister: true }]}
      />
      <Reveal immediate delay={0.35}>
        <p className="mt-8 max-w-md text-xl font-light leading-relaxed text-on-surface-variant">
          This page slipped off the press. It doesn&apos;t exist on this substrate.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="ink-fill inline-flex min-h-15 items-center gap-3.5 bg-brand px-8 font-headline text-sm font-bold uppercase tracking-[0.14em] text-white"
          >
            Back to home
            <ArrowRight className="ink-arrow" />
          </Link>
          <Link
            href="/quote"
            className="inline-flex min-h-15 items-center border border-outline-variant px-7 font-headline text-sm font-bold uppercase tracking-[0.14em] transition-colors hover:border-on-surface hover:bg-surface-container-high"
          >
            Get a quote
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
