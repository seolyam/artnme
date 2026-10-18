/**
 * Philippine mobile numbers arrive as 0917…, +63917…, 63917… or 917…, with
 * spaces and dashes. Store one canonical form (09XXXXXXXXX) so "is this the
 * same customer?" is a plain equality check.
 */

/** Canonical form of a contact: 09XXXXXXXXX for PH mobiles, lowercase for emails, trimmed otherwise. */
export function normalizeContact(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (v.includes("@")) return v.toLowerCase();

  const digits = v.replace(/\D/g, "");
  if (/^639\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^09\d{9}$/.test(digits)) return digits;
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  // Landlines, foreign numbers and anything else: keep what was typed,
  // minus stray whitespace.
  return v.replace(/\s+/g, " ");
}

/** True when the value is (or normalizes to) a PH mobile number. */
export function isPhMobile(value: string | null | undefined) {
  return /^09\d{9}$/.test(normalizeContact(value));
}

/** "09171234567" → "0917 123 4567"; anything else is returned as stored. */
export function formatContact(value: string | null | undefined): string {
  const n = normalizeContact(value);
  if (/^09\d{9}$/.test(n)) return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  return n;
}

/** E.164 for tel:/sms: links ("+639171234567"); non-mobiles keep their digits. */
export function dialable(value: string | null | undefined): string {
  const n = normalizeContact(value);
  if (/^09\d{9}$/.test(n)) return `+63${n.slice(1)}`;
  return n.replace(/[^\d+]/g, "");
}
