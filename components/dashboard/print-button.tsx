"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 border border-outline-variant/60 px-3 text-xs font-semibold hover:border-on-surface-variant print:hidden"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
