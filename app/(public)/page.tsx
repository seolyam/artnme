import Link from "next/link";

import { Hero } from "@/components/landing/Hero";
import { DesignCarousel } from "@/components/landing/DesignCarousel";
import { Marquee } from "@/components/motion/marquee";
import { LineReveal } from "@/components/motion/line-reveal";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ArrowRight } from "@/components/motion/icons";
import { getShowcaseImages } from "@/lib/cloudinary";
import { SITE } from "@/lib/site";

const SERVICES = [
  {
    code: "01 / DTF",
    title: "T-shirts",
    body: "Direct-to-film transfers on cotton and blends. Full color, no minimums, wash-tested.",
    product: "T-Shirt",
  },
  {
    code: "02 / Sublimation",
    title: "Jerseys",
    body: "Edge-to-edge sublimated jerseys and polos for teams, schools and reunions. Names and numbers included.",
    product: "Jersey",
  },
  {
    code: "03 / Souvenirs",
    title: "Mugs & merch",
    body: "Ceramic mugs, lanyards, pins and giveaways that survive the dishwasher and the after-party.",
    product: "Mug",
  },
  {
    code: "04 / Large format",
    title: "Tarpaulins",
    body: "Birthday banners, storefront signage and event backdrops, cut to size and ready to hang.",
    product: "Tarpaulin",
  },
];

const STEPS = [
  { title: "Send it in", body: "Fill out the quote form, upload your file, or build a mockup in the 3D Studio." },
  { title: "Proof & price", body: "We send a digital proof and a firm price, usually within 1–2 production hours." },
  { title: "Press time", body: "A deposit locks your slot. Your job moves from design to print on our floor." },
  { title: "Pick it up", body: `We message you when it's ready at ${SITE.addressLine1}.` },
];

const WHY = [
  {
    title: "Fast turnaround",
    body: "An in-house workflow tuned for speed, without cutting corners on a single droplet.",
    icon: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  },
  {
    title: "Quality ink",
    body: "Industrial-grade CMYK that resists fading. Your colors stay as loud as the day they printed.",
    icon: (
      <>
        <circle cx="9" cy="10" r="5" />
        <circle cx="15" cy="10" r="5" />
        <circle cx="12" cy="15" r="5" />
      </>
    ),
  },
  {
    title: "Family business",
    body: "Personal service from people who live here, with professional-grade digital results.",
    icon: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  },
];

/** Up to ten random showcase pieces, preferring t-shirt work. */
function pickShowcase(images: Awaited<ReturnType<typeof getShowcaseImages>>) {
  const tshirts = images.filter(
    (image) => image.category.includes("T-SHIRT") || image.category.includes("TSHIRT"),
  );
  const pool = tshirts.length > 0 ? tshirts : images;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="spec mb-4 text-accent-ink">{children}</p>;
}

const sectionTitle =
  "font-headline text-[clamp(2.75rem,6vw,5.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.045em]";

// Re-read Cloudinary hourly so new showcase uploads appear without a redeploy.
export const revalidate = 3600;

export default async function Home() {
  const shuffled = pickShowcase(await getShowcaseImages());

  return (
    <main>
      <Hero />

      <div className="-mx-5 -rotate-[1.2deg] border-y-2 border-background bg-brand py-4 font-headline text-2xl font-bold uppercase text-white md:text-3xl">
        <Marquee
          items={["DTF T-shirts", "Sublimation jerseys", "Mugs", "Tarpaulins", "Lanyards", "Pins", "Souvenirs"]}
        />
      </div>

      {/* Services */}
      <section className="mx-auto max-w-[1360px] px-4 pb-28 pt-36 md:px-6">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <Eyebrow>№ 02 — What we print</Eyebrow>
            </Reveal>
            <LineReveal
              as="h2"
              inView
              className={sectionTitle}
              lines={[{ text: "Four presses." }, { text: "Zero excuses." }]}
            />
          </div>
          <Reveal delay={0.2}>
            <p className="max-w-sm leading-relaxed text-on-surface-variant">
              Every job is proofed before it&apos;s printed. Pick a substrate to
              start a quote, or bring something stranger. We like a challenge.
            </p>
          </Reveal>
        </div>

        <Stagger className="grid gap-0.5 border-2 border-surface-container-high bg-surface-container-high sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <StaggerItem key={s.title} className="h-full">
              <Link
                href={`/quote?product=${encodeURIComponent(s.product)}`}
                className="group relative flex h-full min-h-[340px] flex-col justify-between overflow-hidden bg-surface-container-low p-8 transition-[background-color,transform] duration-500 ease-[var(--ease-press)] hover:-translate-y-2 hover:bg-surface-container"
              >
                <span
                  aria-hidden
                  className="absolute right-0 top-0 h-0 w-0 origin-top-right border-l-[44px] border-t-[44px] border-l-transparent border-t-brand transition-transform duration-500 group-hover:scale-[1.6]"
                />
                <span className="spec text-on-surface-variant">{s.code}</span>
                <div>
                  <h3 className="mb-3 font-headline text-3xl font-bold uppercase tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mb-6 text-[15px] leading-relaxed text-on-surface-variant">{s.body}</p>
                  <span className="inline-flex items-center gap-2 font-headline text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">
                    Get a quote
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Showcase */}
      <section className="border-y border-outline-variant/30 bg-surface-container-lowest py-28">
        <div className="mx-auto max-w-[1360px] px-4 md:px-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal>
                <Eyebrow>№ 03 — Fresh off the press</Eyebrow>
              </Reveal>
              <LineReveal as="h2" inView className={sectionTitle} lines={[{ text: "Design showcase" }]} />
            </div>
          </div>
          <Reveal delay={0.1}>
            <DesignCarousel images={shuffled} />
          </Reveal>
          <div className="mt-7 flex justify-end">
            <Link
              href="/portfolio"
              className="link-draw font-headline text-sm font-bold uppercase tracking-[0.14em]"
            >
              See the full archive →
            </Link>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-[1360px] px-4 py-36 md:px-6">
        <Reveal>
          <Eyebrow>№ 04 — How a job moves</Eyebrow>
        </Reveal>
        <LineReveal
          as="h2"
          inView
          className={`${sectionTitle} mb-16`}
          lines={[{ text: "From file" }, { text: "to finished." }]}
        />
        <Stagger className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
          {STEPS.map((step, i) => (
            <StaggerItem key={step.title} className="relative pt-7">
              <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-outline-variant/50" />
              <Reveal
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 origin-left bg-brand"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.25 }}
              />
              <span className="spec text-accent-ink">Step 0{i + 1}</span>
              <h3 className="mb-2.5 mt-3.5 font-headline text-2xl font-bold uppercase tracking-tight">
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-on-surface-variant">{step.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Why us — an inverted printed sheet */}
      <section className="relative overflow-hidden bg-sheet text-sheet-foreground">
        <span aria-hidden className="absolute left-0 top-0 h-0 w-0 border-r-[160px] border-t-[160px] border-r-transparent border-t-brand" />
        <span aria-hidden className="absolute bottom-0 right-0 h-0 w-0 border-b-[110px] border-l-[110px] border-b-sheet-foreground border-l-transparent" />
        <div className="relative mx-auto flex max-w-[1360px] flex-wrap gap-16 px-4 py-36 md:px-6">
          <div className="flex-[1_1_360px]">
            <Reveal>
              <p className="spec mb-4 text-sheet-accent">№ 05 — Why Art &apos;n Me</p>
            </Reveal>
            <LineReveal
              as="h2"
              inView
              className="font-headline text-[clamp(2.75rem,5.5vw,5rem)] font-bold uppercase leading-[0.92] tracking-[-0.045em]"
              lines={[{ text: "Rooted in Silay." }, { text: "Printed like" }, { text: "it's family." }]}
            />
          </div>
          <Stagger className="grid flex-[2_1_560px] gap-10 sm:grid-cols-3" stagger={0.12}>
            {WHY.map((w) => (
              <StaggerItem key={w.title}>
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-9 w-9 text-sheet-accent"
                >
                  {w.icon}
                </svg>
                <h3 className="mb-2.5 mt-5 font-headline text-2xl font-bold uppercase">{w.title}</h3>
                <p className="text-[15px] leading-relaxed text-sheet-muted">{w.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* 3D Studio teaser */}
      <section className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-16 px-4 py-36 md:px-6">
        <Reveal className="relative flex h-[460px] min-w-0 flex-[1_1_420px] items-center justify-center overflow-hidden bg-surface-container-low">
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(var(--surface-high)_1px,transparent_1px),linear-gradient(90deg,var(--surface-high)_1px,transparent_1px)] [background-size:40px_40px]"
          />
          <svg role="img" aria-label="T-shirt preview" viewBox="0 0 200 200" className="animate-slow-turn relative h-72 w-72">
            <path
              d="M70 20 L40 32 L14 62 L36 82 L50 70 L50 182 L150 182 L150 70 L164 82 L186 62 L160 32 L130 20 Q100 44 70 20 Z"
              fill="#f4f1ec"
              stroke="#0a0a0a"
              strokeWidth="2"
            />
            <rect x="78" y="70" width="44" height="44" fill="#e31e24" />
            <path d="M78 114 L122 70 L122 114 Z" fill="#161514" />
          </svg>
          <span className="spec absolute left-5 top-5 text-[11px] text-on-surface-variant">Live preview · 360°</span>
        </Reveal>
        <div className="min-w-0 flex-[1_1_420px]">
          <Reveal>
            <Eyebrow>№ 06 — 3D Studio</Eyebrow>
          </Reveal>
          <LineReveal
            as="h2"
            inView
            className="mb-6 font-headline text-[clamp(2.5rem,5vw,4.5rem)] font-bold uppercase leading-[0.92] tracking-[-0.045em]"
            lines={[{ text: "See it on the shirt" }, { text: "before it hits" }, { text: "the press." }]}
          />
          <Reveal delay={0.2}>
            <p className="mb-9 max-w-[480px] text-lg leading-relaxed text-on-surface-variant">
              Pick a blank, drop in your logo, add text and spin it 360°. Download a
              four-angle mockup, then send it straight to a quote.
            </p>
            <Link
              href="/customizer"
              className="ink-fill inline-flex min-h-15 items-center gap-3.5 bg-brand px-8 font-headline text-[15px] font-bold uppercase tracking-[0.14em] text-white"
            >
              Open the 3D Studio
              <ArrowRight className="ink-arrow" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-brand text-white">
        <div
          aria-hidden
          className="halftone absolute inset-0 [--dot:rgba(0,0,0,0.25)] [mask-image:linear-gradient(90deg,transparent,#000)]"
        />
        <div className="relative mx-auto flex max-w-[1360px] flex-wrap items-end justify-between gap-10 px-4 py-36 md:px-6">
          <LineReveal
            as="h2"
            inView
            className="max-w-[900px] font-headline text-[clamp(3.25rem,8vw,8rem)] font-bold uppercase leading-[0.86] tracking-[-0.055em]"
            lines={[{ text: "Ready to print" }, { text: "your vision?" }]}
          />
          <Reveal delay={0.25} className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:min-w-72">
            <Link
              href="/quote"
              className="ink-fill flex min-h-16 items-center justify-between bg-[#131313] px-7 font-headline text-[15px] font-bold uppercase tracking-[0.14em] text-white"
            >
              Get a quote
              <ArrowRight className="ink-arrow" />
            </Link>
            <a
              href={SITE.facebookHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-16 items-center justify-between border-2 border-white px-7 font-headline text-[15px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-white hover:text-brand"
            >
              Message on Facebook <span aria-hidden>↗</span>
            </a>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
