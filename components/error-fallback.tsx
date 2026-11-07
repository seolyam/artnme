"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MessageCircle, Phone, RotateCcw } from "lucide-react";
import { SITE } from "@/lib/site";

/**
 * What customers see when a page fails (a dropped connection, the server or
 * database briefly down) instead of the browser's bare "Application error".
 * Large print, one obvious button, and a way to reach the shop.
 */
export function ErrorFallback({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-4 py-32">
      <p className="spec mb-4 text-accent-ink">Something went wrong</p>
      <h1 className="font-headline text-4xl font-bold uppercase leading-[0.95] tracking-[-0.04em] md:text-5xl">
        Sorry, this page didn&apos;t load.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-on-surface-variant">
        This is usually a weak internet connection. Press <strong className="text-on-surface">Try again</strong>. If it
        keeps happening, call or message us and we&apos;ll help you order.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={retry}
          className="flex min-h-15 flex-1 items-center justify-center gap-2.5 bg-brand px-6 font-headline text-lg font-bold uppercase tracking-[0.06em] text-white transition-[filter] hover:brightness-110"
        >
          <RotateCcw aria-hidden className="h-5 w-5" />
          Try again
        </button>
        <Link
          href="/"
          className="flex min-h-15 items-center justify-center border-2 border-outline-variant px-6 text-lg font-semibold transition-colors hover:border-on-surface"
        >
          Go to the home page
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-outline-variant/50 pt-6 text-lg">
        <a href={SITE.phoneHref} className="flex min-h-12 items-center gap-3 font-semibold hover:text-brand">
          <Phone aria-hidden className="h-5 w-5 text-brand" />
          Call {SITE.phoneDisplay} · {SITE.hoursLabel}
        </a>
        <a
          href={SITE.facebookHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center gap-3 font-semibold hover:text-brand"
        >
          <MessageCircle aria-hidden className="h-5 w-5 text-brand" />
          Message us on Facebook
        </a>
      </div>
      {error.digest && <p className="mt-6 text-sm text-on-surface-variant">Error code: {error.digest}</p>}
    </main>
  );
}
