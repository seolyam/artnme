"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Mail, MessageCircle, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = {
  customerName: string;
  contact: string | null;
  messengerLink: string | null;
  orderNumber: number;
  title: string;
  status: string;
  total: number;
  balance: number;
  dueLabel: string | null;
};

function money(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Ready-to-send messages built from the order, so staff don't retype order
 * numbers and balances into Messenger or SMS. The default tab follows status.
 */
export function CustomerMessage(props: Props) {
  const first = props.customerName.split(/\s+/)[0] || "there";
  const ref = `#${props.orderNumber} (${props.title})`;

  const templates = useMemo(
    () => [
      {
        key: "quote",
        label: "Quote",
        body:
          props.total > 0
            ? `Hi ${first}! Here's the quote for your order ${ref}: ${money(props.total)} total.${
                props.balance > 0
                  ? ` A ${money(Math.ceil(props.total / 2))} downpayment gets us started (GCash or cash at the studio).`
                  : ""
              }${props.dueLabel ? ` Target date: ${props.dueLabel}.` : ""} — ${SITE.name}`
            : `Hi ${first}! Thanks for your request ${ref}. We're preparing your quote and will send it shortly. — ${SITE.name}`,
      },
      {
        key: "proof",
        label: "Proof",
        body: `Hi ${first}! The design proof for order ${ref} is ready. Please check it and reply "OK" to approve, or tell us what to change. We'll start printing once approved. — ${SITE.name}`,
      },
      {
        key: "ready",
        label: "Ready",
        body: `Hi ${first}! Good news — your order ${ref} is ready for pickup at ${SITE.name}, ${SITE.addressLine1}, ${SITE.addressLine2} (${SITE.hoursLabel}).${
          props.balance > 0 ? ` Remaining balance: ${money(props.balance)}.` : " It's fully paid."
        } See you!`,
      },
      {
        key: "reminder",
        label: "Balance",
        body: `Hi ${first}! Friendly reminder that order ${ref} has a remaining balance of ${money(props.balance)}. You can pay via GCash (${SITE.phoneDisplay}) or at the studio. Thank you!`,
      },
      {
        key: "thanks",
        label: "Thanks",
        body: `Thank you for choosing ${SITE.name}, ${first}! We hope you love order ${ref}. Tag us on Facebook — we'd love to see it in action.`,
      },
    ],
    [first, ref, props.total, props.balance, props.dueLabel],
  );

  const defaultKey =
    props.status === "Ready for Pickup"
      ? "ready"
      : props.status === "Completed"
        ? props.balance > 0
          ? "reminder"
          : "thanks"
        : props.status === "Designing"
          ? "proof"
          : "quote";

  const [active, setActive] = useState(defaultKey);
  const [copied, setCopied] = useState(false);
  const current = templates.find((t) => t.key === active) ?? templates[0];
  const [draft, setDraft] = useState<Record<string, string>>({});
  const text = draft[current.key] ?? current.body;

  const isEmail = !!props.contact && props.contact.includes("@");
  const phone = !isEmail && props.contact ? props.contact.replace(/[^\d+]/g, "") : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Message copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select the text and copy it manually");
    }
  }

  async function openMessenger() {
    await copy();
    window.open(props.messengerLink!, "_blank", "noopener,noreferrer");
  }

  const action =
    "inline-flex min-h-9 items-center gap-1.5 border border-outline-variant/60 px-3 text-xs font-semibold transition-colors hover:border-on-surface-variant";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Message template">
        {templates.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              "spec min-h-8 px-2.5 text-[10px] tracking-[0.08em] transition-colors",
              active === t.key
                ? "bg-on-surface text-surface"
                : "bg-surface-container-high text-on-surface-variant hover:text-on-surface",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        aria-label="Message text"
        value={text}
        onChange={(e) => setDraft((d) => ({ ...d, [current.key]: e.target.value }))}
        rows={5}
        className="w-full resize-y border border-outline-variant/50 bg-surface-container-lowest p-3 text-sm leading-relaxed outline-none focus:border-on-surface-variant"
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={action}>
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          Copy
        </button>
        {props.messengerLink && (
          <button type="button" onClick={openMessenger} className={action}>
            <MessageCircle className="h-3.5 w-3.5" />
            Copy &amp; open Messenger
          </button>
        )}
        {phone && (
          <a href={`sms:${phone}?body=${encodeURIComponent(text)}`} className={action}>
            <MessageSquareText className="h-3.5 w-3.5" />
            Send SMS
          </a>
        )}
        {isEmail && (
          <a
            href={`mailto:${props.contact}?subject=${encodeURIComponent(`${SITE.name} order #${props.orderNumber}`)}&body=${encodeURIComponent(text)}`}
            className={action}
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </a>
        )}
      </div>
    </div>
  );
}
