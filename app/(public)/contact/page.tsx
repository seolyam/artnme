import { ContactRows, OpenBadge } from "@/components/contact/ContactRows";
import { LineReveal } from "@/components/motion/line-reveal";
import { Reveal } from "@/components/motion/reveal";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Contact — Art 'n Me",
  description: `Visit Art 'n Me at ${SITE.addressLine1}, ${SITE.addressLine2}. Call ${SITE.phoneDisplay}.`,
};

export default function ContactPage() {
  return (
    <main>
      <header className="mx-auto flex max-w-[1360px] flex-wrap items-end justify-between gap-10 px-4 pb-18 pt-36 md:px-6 md:pt-44">
        <div>
          <Reveal immediate y={12}>
            <p className="spec mb-6 text-accent-ink">Get in touch</p>
          </Reveal>
          <LineReveal
            className="font-headline text-[clamp(4rem,10vw,10.5rem)] font-bold uppercase leading-[0.84] tracking-[-0.06em]"
            lines={[{ text: "Say" }, { text: "hello.", className: "text-brand", misregister: true }]}
          />
        </div>
        <Reveal immediate delay={0.4} className="max-w-sm">
          <p className="mb-5 text-lg font-light leading-relaxed text-on-surface-variant">
            Walk in, call, or message. Bring your file on a flash drive or send it
            ahead.
          </p>
          <OpenBadge />
        </Reveal>
      </header>

      <section aria-label="Ways to reach us" className="mx-auto max-w-[1360px] px-4 md:px-6">
        <ContactRows />
      </section>

      <section className="mx-auto flex max-w-[1360px] flex-wrap gap-12 px-4 py-32 md:px-6">
        <Reveal className="min-w-0 flex-[1_1_320px]">
          <p className="spec mb-4 text-accent-ink">Press hours</p>
          <h2 className="mb-8 font-headline text-5xl font-bold uppercase leading-[0.95] tracking-[-0.04em]">
            When the
            <br />
            ink&apos;s wet.
          </h2>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-outline-variant/40">
                <th scope="row" className="py-4 text-left font-semibold">Monday – Saturday</th>
                <td className="py-4 text-right font-mono">9:00 – 18:00</td>
              </tr>
              <tr className="border-b border-outline-variant/40 text-on-surface-variant">
                <th scope="row" className="py-4 text-left font-semibold">Sunday</th>
                <td className="py-4 text-right font-mono">Closed</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-6 text-sm leading-relaxed text-on-surface-variant">
            Look for us at {SITE.landmark}.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="relative min-h-[520px] min-w-0 flex-[2_1_560px] overflow-hidden bg-surface-container-high">
          <iframe
            title="Map showing Art 'n Me in Silay City"
            src={SITE.mapEmbedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0 grayscale-[0.35] dark:hue-rotate-180 dark:invert-[0.92]"
          />
          <div className="pointer-events-none absolute left-4 top-4 max-w-80 bg-background/95 p-5 backdrop-blur-sm">
            <p className="mb-1.5 font-headline text-lg font-bold uppercase">Art &apos;n Me Studio</p>
            <p className="mb-2.5 text-sm leading-relaxed text-on-surface-variant">
              {SITE.addressLine1}, {SITE.addressLine2}
            </p>
            <p className="spec text-[11px] text-on-surface-variant">
              {SITE.coords.lat.toFixed(5)}° N · {SITE.coords.lng.toFixed(5)}° E
            </p>
          </div>
          <a
            href={SITE.directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-6 right-6 inline-flex min-h-16 -skew-x-10 items-center gap-3 bg-brand px-7 font-headline text-lg font-bold uppercase italic text-white shadow-[8px_8px_0_#131313] transition-transform duration-400 ease-[var(--ease-press)] hover:-skew-x-10 hover:scale-105 md:text-xl"
          >
            Get directions ↗
          </a>
        </Reveal>
      </section>
    </main>
  );
}
