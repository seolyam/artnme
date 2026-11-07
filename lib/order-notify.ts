import { Resend } from "resend";
import { SITE } from "@/lib/site";
import { emailFrom } from "@/lib/quote-notify";

export type TrackingEmailInput = {
  orderNumber: number;
  customerName: string;
  title: string;
  trackingUrl: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Where to send customer emails: the saved email, else an email someone typed
 * into the older "Phone or email" contact field.
 */
export function customerEmailOf(c: { email?: string | null; contactNumber?: string | null }): string | null {
  for (const raw of [c.email, c.contactNumber]) {
    const value = raw?.trim().toLowerCase();
    if (value && EMAIL.test(value)) return value;
  }
  return null;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildTrackingEmail(input: TrackingEmailInput) {
  const ref = `#${String(input.orderNumber).padStart(4, "0")}`;
  const first = input.customerName.trim().split(/\s+/)[0] || "there";
  const subject = `Your ${SITE.name} order ${ref} — track its progress`;

  const text = [
    `Hi ${first},`,
    "",
    `Thanks for your order with ${SITE.name}! We've received order ${ref} (${input.title}).`,
    "",
    "You can check its progress anytime here:",
    input.trackingUrl,
    "",
    `Questions? Call or text us at ${SITE.phoneDisplay}.`,
    "",
    `— ${SITE.name}`,
  ].join("\n");

  const url = escapeHtml(input.trackingUrl);
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a">
<p>Hi ${escapeHtml(first)},</p>
<p>Thanks for your order with ${escapeHtml(SITE.name)}! We've received order <strong>${ref}</strong> (${escapeHtml(input.title)}).</p>
<p><a href="${url}" style="display:inline-block;background:#E31E24;color:#fff;padding:12px 20px;text-decoration:none;font-weight:bold">Track your order</a></p>
<p style="font-size:13px;color:#555">Or open this link: <a href="${url}">${url}</a></p>
<p>Questions? Call or text us at ${escapeHtml(SITE.phoneDisplay)}.</p>
<p>— ${escapeHtml(SITE.name)}</p>
</div>`;

  return { subject, text, html };
}

/**
 * Best-effort: a failed email must never fail creating the order.
 * Returns true only when Resend accepted the message.
 */
export async function sendTrackingEmail(to: string, input: TrackingEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set; tracking email skipped");
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: emailFrom(),
      to,
      ...buildTrackingEmail(input),
    });
    if (error) {
      console.error("Tracking email failed", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Tracking email failed", error);
    return false;
  }
}
