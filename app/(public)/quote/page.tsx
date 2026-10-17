import { QuoteForm } from "@/components/quote/QuoteForm";
import { LineReveal } from "@/components/motion/line-reveal";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SITE } from "@/lib/site";
import { QUOTE_PRODUCTS, type QuoteProduct } from "@/lib/validators";

export const metadata = {
  title: "Get a Quote — Art 'n Me",
  description: "Request a print quote for shirts, jerseys, mugs and tarpaulins from Art 'n Me in Silay City.",
};

const STEPS = [
  { title: "You send the brief", body: "Two minutes. A file helps but is optional." },
  { title: "We price it", body: "Usually within 1–2 production hours." },
  { title: "Approve & print", body: "A deposit locks your slot on the press." },
];

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; from?: string }>;
}) {
  const sp = await searchParams;
  const initialProduct = QUOTE_PRODUCTS.find(
    (p) => p.value.toLowerCase() === sp.product?.toLowerCase(),
  )?.value as QuoteProduct | undefined;
  const source = sp.from === "studio" ? "studio" : undefined;

  return (
    <main className="mx-auto flex max-w-[1360px] flex-wrap items-start gap-16 px-4 pb-32 pt-36 md:px-6 md:pt-44">
      <div className="min-w-0 flex-[1_1_380px]">
        <Reveal immediate y={12}>
          <p className="spec mb-6 text-accent-ink">Initiate project</p>
        </Reveal>
        <LineReveal
          className="font-headline text-[clamp(3.5rem,8vw,7.5rem)] font-bold uppercase leading-[0.86] tracking-[-0.055em]"
          lines={[{ text: "Get a" }, { text: "quote.", className: "text-brand", misregister: true }]}
        />
        <Reveal immediate delay={0.4}>
          <p className="mb-12 mt-8 max-w-md text-lg font-light leading-relaxed text-on-surface-variant">
            Tell us what you need. Your request lands directly on our production
            board and we reply with a proof and a firm price.
          </p>
          {source && (
            <p className="spec -mt-6 mb-10 inline-flex border border-brand/60 px-3 py-2 text-accent-ink">
              Coming from the 3D Studio — attach your downloaded mockup below
            </p>
          )}
        </Reveal>

        <Stagger delay={0.5} className="border-t border-outline-variant/40">
          {STEPS.map((step, i) => (
            <StaggerItem key={step.title} className="flex gap-5 border-b border-outline-variant/40 py-5">
              <span className="spec pt-1 text-accent-ink">0{i + 1}</span>
              <span>
                <span className="block font-headline text-lg font-bold uppercase">{step.title}</span>
                <span className="text-sm text-on-surface-variant">{step.body}</span>
              </span>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.2} className="mt-10 flex flex-col items-start gap-3.5">
          <a href={SITE.phoneHref} className="link-draw flex items-center gap-3">
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="#e31e24" strokeWidth={2} className="h-4.5 w-4.5">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
            </svg>
            {SITE.phoneDisplay} · {SITE.hoursLabel}
          </a>
          <a href={SITE.facebookHref} target="_blank" rel="noopener noreferrer" className="link-draw flex items-center gap-3">
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="#e31e24" strokeWidth={2} className="h-4.5 w-4.5">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            </svg>
            Prefer chat? Message us on Facebook
          </a>
        </Reveal>
      </div>

      <div className="min-w-0 flex-[1.4_1_560px] pr-3.5">
        <QuoteForm initialProduct={initialProduct} source={source} />
      </div>
    </main>
  );
}
