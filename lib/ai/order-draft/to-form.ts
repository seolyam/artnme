import type { ExtractedContacts } from "../redact";

export const MAX_CHAT_CHARS = 4000;

/** Long chats keep their newest part (the latest messages matter most),
 *  starting at a line break when there is one. */
export function keepLatest(text: string, max = MAX_CHAT_CHARS): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  const tail = text.slice(-max);
  const nl = tail.indexOf("\n");
  return { text: nl >= 0 && nl < tail.length - 1 ? tail.slice(nl + 1) : tail, truncated: true };
}

/** New-customer fields from what the chat gave away. */
export function newCustomerPrefill(name: string | null, contacts: ExtractedContacts) {
  const phone = contacts.phones[0] ?? "";
  const email = contacts.emails[0] ?? "";
  const messenger = contacts.messenger[0] ?? "";
  if (!name && !phone && !email && !messenger) return undefined;
  return { name: name ?? "", contact: phone || email, email, messenger };
}
