import { Resend } from "resend";

export const QUOTE_NOTIFY_TO = "artinme03@gmail.com";

// Resend only delivers from a verified domain. The default sender works for
// testing, but it only delivers to the Resend account owner's address.
const DEFAULT_FROM = "Art 'N Me <onboarding@resend.dev>";

export type QuoteEmailInput = {
  orderNumber: number;
  name: string;
  contact: string;
  email: string;
  productLabel: string;
  quantity: number;
  details?: string | null;
  neededBy: Date | null;
  source?: string;
  attachmentUrl: string | null;
};

export function buildQuoteEmail(input: QuoteEmailInput) {
  const subject = `New quote #${input.orderNumber}: ${input.quantity}× ${input.productLabel}`;

  const lines = [
    `Order: #${input.orderNumber}`,
    `Name: ${input.name}`,
    `Phone: ${input.contact}`,
    `Email: ${input.email}`,
    `Product: ${input.quantity}× ${input.productLabel}`,
    input.neededBy ? `Needed by: ${input.neededBy.toDateString()}` : null,
    input.source === "studio" ? "Source: 3D Studio mockup" : null,
    "",
    input.details ? `Details:\n${input.details}` : null,
    input.attachmentUrl ? `Attachment: ${input.attachmentUrl}` : null,
  ];

  return {
    subject,
    text: lines.filter((line) => line !== null).join("\n"),
  };
}

// Best-effort: a failed alert must never fail the customer's quote submission.
export async function notifyQuoteRequest(input: QuoteEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set; quote alert email skipped");
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: process.env.QUOTE_EMAIL_FROM || DEFAULT_FROM,
      to: QUOTE_NOTIFY_TO,
      // Hitting reply in Gmail goes straight to the customer.
      replyTo: input.email,
      ...buildQuoteEmail(input),
    });
    if (error) {
      console.error("Quote alert email failed", error);
      return;
    }
    return data?.id;
  } catch (error) {
    console.error("Quote alert email failed", error);
  }
}
