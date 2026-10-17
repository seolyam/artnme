import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Shared page heading: optional back link, mono eyebrow, big headline, one
 * plain-language line of help, and actions on the right (stacked on phones).
 */
export function PageHeader({
  back,
  eyebrow,
  title,
  description,
  actions,
}: {
  back?: { href: string; label: string };
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="space-y-4">
      {back && (
        <Link
          href={back.href}
          className="spec inline-flex min-h-8 items-center gap-1.5 text-[11px] text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="spec mb-2 text-[11px] text-on-surface-variant">{eyebrow}</p>}
          <h1 className="font-headline text-4xl font-bold uppercase leading-none tracking-[-0.045em] md:text-5xl">
            {title}
          </h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** The red primary call-to-action used in page headers ("New order"). */
export function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="ink-fill inline-flex min-h-12 items-center gap-2 bg-brand px-5 font-headline text-xs font-bold uppercase tracking-[0.14em] text-white"
    >
      {children}
    </Link>
  );
}
