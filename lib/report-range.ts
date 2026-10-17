import { addShopDays, shopDayRange, shopToday } from "@/lib/time";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_RANGE_DAYS = 366;
export const DEFAULT_RANGE_DAYS = 30;

/**
 * Turn ?from=&to= into a safe shop-day range: valid dates, from ≤ to, nothing
 * in the future, at most a year. Defaults to the last 30 days.
 */
export function resolveRange(from?: string | null, to?: string | null, today: string = shopToday()) {
  let end = to && DAY.test(to) && !Number.isNaN(Date.parse(to)) ? to : today;
  if (end > today) end = today;
  let start = from && DAY.test(from) && !Number.isNaN(Date.parse(from)) ? from : addShopDays(end, -(DEFAULT_RANGE_DAYS - 1));
  if (start > end) [start, end] = [end, start];
  const days = rangeDays(start, end);
  if (days > MAX_RANGE_DAYS) start = addShopDays(end, -(MAX_RANGE_DAYS - 1));
  return { from: start, to: end, days: rangeDays(start, end) };
}

/** Number of shop days from `from` to `to`, inclusive. */
export function rangeDays(from: string, to: string) {
  return Math.round((shopDayRange(to).start.getTime() - shopDayRange(from).start.getTime()) / 86_400_000) + 1;
}

/** Every shop day from `from` to `to`, inclusive. */
export function eachDay(from: string, to: string) {
  const out: string[] = [];
  for (let d = from; d <= to && out.length <= MAX_RANGE_DAYS; d = addShopDays(d, 1)) out.push(d);
  return out;
}

/** UTC instants bounding a shop-day range: [start of `from`, end of `to`). */
export function rangeBounds(from: string, to: string) {
  return { start: shopDayRange(from).start, end: shopDayRange(to).end };
}

/** How old an unpaid balance is, for the receivables page. */
export const AGE_BUCKETS = [
  { key: "week", label: "Up to 7 days", max: 7 },
  { key: "month", label: "8–30 days", max: 30 },
  { key: "two", label: "31–60 days", max: 60 },
  { key: "old", label: "Over 60 days", max: Infinity },
] as const;

export function ageBucket(ageDays: number) {
  return AGE_BUCKETS.find((b) => ageDays <= b.max) ?? AGE_BUCKETS[AGE_BUCKETS.length - 1];
}
