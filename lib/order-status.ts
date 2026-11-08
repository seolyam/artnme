import { WEB_QUOTE_PREFIX } from "@/lib/validators";

/**
 * One status palette for every dashboard surface. Colors differ in lightness
 * as well as hue so the columns stay distinguishable for color-blind staff.
 */
export const STATUS_STYLE: Record<
  string,
  { short: string; dot: string; text: string; soft: string; border: string; rail: string }
> = {
  Pending: {
    short: "Pending",
    dot: "bg-[#f2b33d]",
    text: "text-amber-700 dark:text-[#f2b33d]",
    soft: "bg-[#f2b33d]/12",
    border: "border-t-[#f2b33d]",
    rail: "border-l-[#f2b33d]",
  },
  Designing: {
    short: "Designing",
    dot: "bg-[#6aa7ff]",
    text: "text-blue-700 dark:text-[#6aa7ff]",
    soft: "bg-[#6aa7ff]/12",
    border: "border-t-[#6aa7ff]",
    rail: "border-l-[#6aa7ff]",
  },
  Printing: {
    short: "Printing",
    dot: "bg-brand",
    text: "text-accent-ink",
    soft: "bg-brand/12",
    border: "border-t-brand",
    rail: "border-l-brand",
  },
  Sewing: {
    short: "Sewing",
    dot: "bg-[#b07cff]",
    text: "text-violet-700 dark:text-[#b07cff]",
    soft: "bg-[#b07cff]/12",
    border: "border-t-[#b07cff]",
    rail: "border-l-[#b07cff]",
  },
  "Ready for Pickup": {
    short: "Ready",
    dot: "bg-success",
    text: "text-success",
    soft: "bg-success/12",
    border: "border-t-success",
    rail: "border-l-success",
  },
  Completed: {
    short: "Done",
    dot: "bg-on-surface-variant/60",
    text: "text-on-surface-variant",
    soft: "bg-muted/60",
    border: "border-t-on-surface-variant/50",
    rail: "border-l-on-surface-variant/50",
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

/** A web quote item's description without the lines the quote form adds
 *  (contact, needed-by date, attachment, source), i.e. what the customer asked for. */
export function stripQuoteMeta(description: string | null | undefined) {
  return (description ?? "")
    .split("\n")
    .filter((l) => !/^(Contact|Needed by|Attachment|Source):/.test(l))
    .join("\n");
}

const SEQUENCE = ["Pending", "Designing", "Printing", "Sewing", "Ready for Pickup", "Completed"] as const;

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

/** Trashed orders are permanently deleted by the daily cron after this long. */
export const TRASH_RETENTION_DAYS = 30;
