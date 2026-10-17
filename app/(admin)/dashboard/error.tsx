"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="w-full max-w-md space-y-5 bg-surface-container-low p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center bg-brand/10">
          <AlertTriangle className="h-7 w-7 text-brand" strokeWidth={2} />
        </div>

        <h2 className="font-headline text-xl font-bold uppercase tracking-tight">Something went wrong</h2>

        <p className="text-sm leading-relaxed text-on-surface-variant">
          The page couldn&apos;t load. This is usually a dropped connection: check the Wi-Fi and press Try again.
        </p>
        {error.digest && <p className="spec text-[10px] text-on-surface-variant">Ref {error.digest}</p>}

        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-2 bg-on-surface px-5 font-headline text-xs font-bold uppercase tracking-[0.1em] text-surface"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center border border-outline-variant/60 px-5 text-sm font-semibold hover:border-on-surface-variant"
          >
            Back to the command center
          </Link>
        </div>
      </div>
    </div>
  );
}
