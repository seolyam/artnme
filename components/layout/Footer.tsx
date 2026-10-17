import Link from "next/link";
import { SITE } from "@/lib/site";

const EXPLORE = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/customizer", label: "3D Studio" },
  { href: "/quote", label: "Get a quote" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-outline-variant/30 bg-surface-container-lowest">
      <div className="mx-auto max-w-[1360px] px-4 pb-10 pt-24 md:px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src="/images/art-n-me-logo.jpg"
              alt="Art 'n Me logo"
              className="h-18 w-18 object-cover"
            />
            <p className="mt-5 max-w-64 text-sm leading-relaxed text-on-surface-variant">
              A digital printing studio in the heart of Silay City. We turn ideas
              into substrate.
            </p>
          </div>

          <div>
            <p className="spec mb-5 text-accent-ink">Visit</p>
            <address className="not-italic leading-loose">
              <a
                href={SITE.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="link-draw"
              >
                {SITE.addressLine1}
              </a>
              <br />
              {SITE.addressLine2}
              <br />
              <span className="text-on-surface-variant">{SITE.hoursLabel}</span>
            </address>
          </div>

          <div className="flex flex-col items-start gap-3">
            <p className="spec mb-2 text-accent-ink">Contact</p>
            <a href={SITE.phoneHref} className="link-draw">
              {SITE.phoneDisplay}
            </a>
            <a href={`mailto:${SITE.email}`} className="link-draw">
              {SITE.email}
            </a>
            <a href={SITE.facebookHref} target="_blank" rel="noopener noreferrer" className="link-draw">
              Facebook
            </a>
            <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="link-draw">
              WhatsApp
            </a>
          </div>

          <div className="flex flex-col items-start gap-3">
            <p className="spec mb-2 text-accent-ink">Explore</p>
            {EXPLORE.map((l) => (
              <Link key={l.href} href={l.href} className="link-draw">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <p
          aria-hidden
          className="text-outline mt-20 whitespace-nowrap font-headline text-[15vw] font-bold uppercase leading-[0.8] tracking-[-0.06em] text-outline-variant/70 xl:text-[13.5rem]"
        >
          Art &apos;n Me
        </p>

        <div className="spec mt-8 flex flex-wrap justify-between gap-3 border-t border-outline-variant/30 pt-6 text-[11px] text-on-surface-variant">
          <span>
            © {new Date().getFullYear()} {SITE.legalName}
          </span>
          <Link href="/login" className="link-draw">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
