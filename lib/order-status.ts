import { WEB_QUOTE_PREFIX } from "@/lib/validators";

/**
 * One status palette for every dashboard surface. Colors differ in lightness
 * as well as hue so the columns stay distinguishable for color-blind staff.
 */
export const STATUS_STYLE: Record<
  string,
  { short: string; dot: string; text: string; soft: string; border: string }
> = {
  Pending: {
    short: "Pending",
    dot: "bg-[#f2b33d]",
    text: "text-amber-700 dark:text-[#f2b33d]",
    soft: "bg-[#f2b33d]/12",
    border: "border-t-[#f2b33d]",
  },
  Designing: {
    short: "Designing",
    dot: "bg-[#6aa7ff]",
    text: "text-blue-700 dark:text-[#6aa7ff]",
    soft: "bg-[#6aa7ff]/12",
    border: "border-t-[#6aa7ff]",
  },
  Printing: {
    short: "Printing",
    dot: "bg-brand",
    text: "text-accent-ink",
    soft: "bg-brand/12",
    border: "border-t-brand",
  },
  "Ready for Pickup": {
    short: "Ready",
    dot: "bg-success",
    text: "text-success",
    soft: "bg-success/12",
    border: "border-t-success",
  },
  Completed: {
    short: "Done",
    dot: "bg-on-surface-variant/60",
    text: "text-on-surface-variant",
    soft: "bg-muted/60",
    border: "border-t-on-surface-variant/50",
  },
};

export const FALLBACK_STATUS_STYLE = STATUS_STYLE.Completed;

export function statusStyle(status: string) {
  return STATUS_STYLE[status] ?? FALLBACK_STATUS_STYLE;
}

/** Orders created by the public quote form carry this title prefix. */
export function isWebQuote(title: string) {
  return title.startsWith(WEB_QUOTE_PREFIX);
}

const SEQUENCE = ["Pending", "Designing", "Printing", "Ready for Pickup", "Completed"] as const;

/** The status a job normally moves to next, or null once it's done. */
export function nextStatus(current: string): (typeof SEQUENCE)[number] | null {
  const idx = SEQUENCE.indexOf(current as (typeof SEQUENCE)[number]);
  if (idx === -1 || idx >= SEQUENCE.length - 1) return null;
  return SEQUENCE[idx + 1];
}

/** Two-letter initials for assignee chips. */
export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return (
    name
      .split(/\s+/)
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/** Completed jobs stay on the board this long, then live on the customer page. */
export const BOARD_ARCHIVE_DAYS = 14;
