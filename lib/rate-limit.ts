// Best-effort, per-instance sliding-window throttle. Serverless instances don't
// share this memory, so it only slows down one client hammering one instance;
// spend limits that must hold (AI Gateway budget) live outside the app.

type ThrottleOptions = {
  windowMs: number;
  max: number;
  /** Clock override for tests. */
  now?: () => number;
};

export function createThrottle({ windowMs, max, now = Date.now }: ThrottleOptions) {
  const recent = new Map<string, number[]>();

  return {
    /** Records a hit for `key`. Returns true when the caller is over the limit
     *  and should be refused; refused hits are not counted. */
    hit(key: string): boolean {
      const t = now();
      const hits = (recent.get(key) ?? []).filter((at) => t - at < windowMs);
      if (hits.length >= max) {
        recent.set(key, hits);
        return true;
      }
      hits.push(t);
      recent.set(key, hits);
      return false;
    },
  };
}
