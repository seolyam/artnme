import { isPhMobile, normalizeContact } from "@/lib/phone";

// Customer contact details never leave the server: they're swapped for
// placeholders before text goes to a model, and matched to customers locally.

export type ExtractedContacts = { phones: string[]; emails: string[]; messenger: string[] };

const LINK = /(?:https?:\/\/)?(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.com|messenger\.com|m\.me)\/[^\s,;()<>]+/gi;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// A PH mobile in any format normalizeContact accepts: 0917…, +63 917…,
// 63917…, 917…, with spaces, dashes or "(0917)". Digits on either side mean
// it's part of a longer number, so it's left alone.
const PHONE = /(?<![\d+])(?:\+?63[\s-]?|0)?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{4}(?!\d)/g;

function masker(prefix: string, found: string[]) {
  const seen = new Map<string, string>();
  return (value: string) => {
    let tag = seen.get(value);
    if (!tag) {
      found.push(value);
      tag = `[${prefix}_${found.length}]`;
      seen.set(value, tag);
    }
    return tag;
  };
}

export function redactContacts(input: string): { text: string; contacts: ExtractedContacts } {
  const contacts: ExtractedContacts = { phones: [], emails: [], messenger: [] };
  const link = masker("LINK", contacts.messenger);
  const email = masker("EMAIL", contacts.emails);
  const phone = masker("PHONE", contacts.phones);

  const text = input
    .replace(LINK, (raw) => {
      const url = raw.replace(/[.!?]+$/, "");
      const tail = raw.slice(url.length);
      return link(/^https?:\/\//i.test(url) ? url : `https://${url}`) + tail;
    })
    .replace(EMAIL, (raw) => email(raw.toLowerCase()))
    .replace(PHONE, (raw) => {
      const normalized = normalizeContact(raw.replace(/[()]/g, ""));
      return isPhMobile(normalized) ? phone(normalized) : raw;
    });

  return { text, contacts };
}
