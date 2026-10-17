"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { SITE, isStudioOpen } from "@/lib/site";
import { cn } from "@/lib/utils";

const ROWS = [
  {
    kind: "Visit",
    value: SITE.addressLine1,
    note: `${SITE.addressLine2} · ${SITE.landmark}`,
    href: SITE.mapsHref,
    copy: `${SITE.addressLine1}, ${SITE.addressLine2}`,
    external: true,
  },
  {
    kind: "Call",
    value: SITE.phoneDisplay,
    note: "Direct line · WhatsApp · Viber",
    href: SITE.phoneHref,
    copy: SITE.phoneDisplay,
  },
  {
    kind: "Email",
    value: SITE.email,
    note: "Files, invoices and general inquiries",
    href: `mailto:${SITE.email}`,
    copy: SITE.email,
  },
  {
    kind: "Message",
    value: SITE.facebookHandle,
    note: "Art 'n Me Digital Printing Services and Studios",
    href: SITE.facebookHref,
    copy: SITE.facebookHref,
    external: true,
  },
];

export function ContactRows() {
  const [copied, setCopied] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (i: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      clearTimeout(timer.current);
      setCopied(i);
      timer.current = setTimeout(() => setCopied(null), 1800);
    } catch {
      // Clipboard can be blocked (insecure context); the link still works.
    }
  };

  return (
    <Stagger className="border-t border-outline-variant/50" stagger={0.08}>
      {ROWS.map((row, i) => (
        <StaggerItem key={row.kind} className="flex flex-wrap items-stretch border-b border-outline-variant/50">
          <a
            href={row.href}
            {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group relative isolate flex min-w-0 flex-[1_1_520px] flex-wrap items-center gap-6 overflow-hidden px-2 py-8 transition-colors duration-300 hover:text-white"
          >
            <span
              aria-hidden
              className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-brand transition-transform duration-500 ease-[var(--ease-press)] group-hover:scale-y-100"
            />
            <span className="spec w-36 text-accent-ink transition-colors group-hover:text-white">
              0{i + 1} · {row.kind}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block break-words font-headline text-[clamp(1.6rem,3.4vw,3rem)] font-bold leading-[1.05] tracking-[-0.035em]">
                {row.value}
              </span>
              <span className="mt-1.5 block text-sm opacity-75">{row.note}</span>
            </span>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-9 w-9 transition-transform duration-400 group-hover:-translate-y-1.5 group-hover:translate-x-1.5"
            >
              <path d="M7 17L17 7M8 7h9v9" />
            </svg>
          </a>
          <button
            type="button"
            onClick={() => copy(i, row.copy)}
            aria-label={`Copy ${row.kind.toLowerCase()} details`}
            className="spec relative min-h-11 w-full border-t border-outline-variant/50 text-[11px] text-on-surface-variant transition-colors hover:bg-sheet hover:text-sheet-foreground sm:w-32 sm:border-l sm:border-t-0"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={copied === i ? "done" : "copy"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className={cn("inline-block", copied === i && "text-success")}
              >
                {copied === i ? "Copied ✓" : "Copy"}
              </motion.span>
            </AnimatePresence>
          </button>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/** "Open now" pill computed on the client so a cached page never shows stale hours. */
export function OpenBadge() {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setOpen(isStudioOpen());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  if (open === null) {
    return <span className="spec inline-flex min-h-10 items-center px-3.5 text-on-surface-variant">{SITE.hoursLabel}</span>;
  }

  return (
    <span
      className={cn(
        "spec inline-flex min-h-10 items-center gap-2.5 border px-3.5",
        open ? "border-success/50 bg-success/10 text-success" : "border-outline-variant/60 text-on-surface-variant",
      )}
    >
      <span className="relative h-2 w-2">
        <span className={cn("absolute inset-0", open ? "bg-success" : "bg-on-surface-variant")} />
        {open && <span className="animate-ping-square absolute inset-0 bg-success" />}
      </span>
      {open ? "Open now · until 6PM" : `Closed now · ${SITE.hoursLabel}`}
    </span>
  );
}
