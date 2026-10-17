/**
 * The shop runs on Manila time, but the server (Vercel) runs on UTC and staff
 * browsers can be anywhere. Everything that means "a wall-clock time at the
 * shop" goes through these helpers.
 */

export const SHOP_TZ = "Asia/Manila";
const SHOP_OFFSET = "+08:00"; // the Philippines has no daylight saving

/**
 * Parse a `datetime-local` / `date` input value as Manila time.
 * Values that already carry an offset or "Z" are left alone.
 */
export function parseShopDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(v);
  const withTime = /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T17:00` : v;
  const d = new Date(hasZone ? withTime : `${withTime}${SHOP_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format a Date as a `datetime-local` input value in Manila time. */
export function toShopInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Today's date at the shop as YYYY-MM-DD. */
export function shopToday(now = new Date()): string {
  return toShopInputValue(now).slice(0, 10);
}

/** [start, end) of a shop-local day (YYYY-MM-DD) as UTC instants. */
export function shopDayRange(day: string): { start: Date; end: Date } {
  const start = new Date(`${day}T00:00:00${SHOP_OFFSET}`);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

export function formatShopDate(
  date: Date | string,
  opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  return new Date(date).toLocaleDateString("en-PH", { timeZone: SHOP_TZ, ...opts });
}

export function formatShopTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-PH", {
    timeZone: SHOP_TZ,
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "just now", "5m ago", "3h ago", "2d ago", then a date. */
export function timeAgo(date: Date | string, now = new Date()) {
  const diff = Math.max(0, now.getTime() - new Date(date).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatShopDate(date, { month: "short", day: "numeric", year: "numeric" });
}

/** Whole days from now until `date` in shop days (negative when past). */
export function daysUntil(date: Date | string, now = new Date()) {
  const a = shopDayRange(shopToday(now)).start.getTime();
  const b = shopDayRange(shopToday(new Date(date))).start.getTime();
  return Math.round((b - a) / 86_400_000);
}
