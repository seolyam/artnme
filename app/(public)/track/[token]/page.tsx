import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock, Check, MapPin, MessageCircle, Phone } from "lucide-react";
import { getTrackedOrder } from "@/lib/tracking";
import { SITE } from "@/lib/site";
import { peso, roundMoney, toNumber } from "@/lib/money";
import { daysUntil, formatShopDate, formatShopTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your order — Art 'n Me",
  robots: { index: false, follow: false },
};

const STEPS = [
  { status: "Pending", label: "Received", text: "We have your order and will confirm the details with you soon." },
  { status: "Designing", label: "Designing", text: "We're working on your design. We'll send you a proof to approve." },
  { status: "Printing", label: "Printing", text: "Your design is approved and being printed." },
  { status: "Ready for Pickup", label: "Ready", text: "Your order is ready! Come by the studio during opening hours." },
  { status: "Completed", label: "Picked up", text: "Picked up. Thank you for ordering with us!" },
];

export default async function TrackOrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getTrackedOrder(token);
  if (!order) notFound();

  const current = Math.max(0, STEPS.findIndex((s) => s.status === order.status));
  const step = STEPS[current];
  const total = toNumber(order.totalAmount);
  const paid = toNumber(order.depositAmount);
  const balance = Math.max(0, roundMoney(total - paid));
  const done = order.status === "Completed";
  const dueIn = order.dueDate && !done ? daysUntil(order.dueDate) : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-32 md:pt-40">
      <p className="spec mb-3 text-[11px] text-accent-ink">Order #{String(order.orderNumber).padStart(4, "0")}</p>
      <h1 className="font-headline text-4xl font-bold uppercase leading-[0.9] tracking-[-0.05em] md:text-6xl">
        Hi {order.firstName}!
      </h1>
      <p className="mt-3 text-lg text-on-surface-variant">{order.title}</p>

      {/* Status */}
      <section aria-label="Order status" className="mt-10 bg-surface-container-low p-5 md:p-7">
        <p className="spec text-[11px] text-on-surface-variant">Status</p>
        <p className="mt-1 font-headline text-3xl font-bold uppercase tracking-[-0.03em]">{step.label}</p>
        <p className="mt-2 text-on-surface-variant">{step.text}</p>

        <ol className="mt-6 grid grid-cols-5 gap-1" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s.status} aria-current={i === current ? "step" : undefined} className="space-y-2">
              <div className={cn("h-1.5", i <= current ? "bg-brand" : "bg-surface-container-high")} />
              <p
                className={cn(
                  "flex items-center gap-1 text-[11px] leading-tight sm:text-xs",
                  i === current ? "font-semibold text-on-surface" : "text-on-surface-variant",
                )}
              >
                {i < current && <Check className="hidden h-3 w-3 shrink-0 sm:block" />}
                {s.label}
              </p>
            </li>
          ))}
        </ol>

        {order.proofCount > 0 && !done && (
          <p className="mt-5 text-sm text-on-surface-variant">
            {order.proofApproved
              ? "You approved the design proof. Thank you!"
              : "We sent you a design proof. Reply to us on Messenger or by text to approve it."}
          </p>
        )}
      </section>

      {/* Dates & money */}
      <div className="mt-0.5 grid gap-0.5 bg-surface-container-high sm:grid-cols-2">
        <div className="bg-surface-container-low p-5">
          <p className="spec flex items-center gap-1.5 text-[11px] text-on-surface-variant">
            <CalendarClock className="h-3.5 w-3.5" />
            {done ? "Ordered" : "Target date"}
          </p>
          {done ? (
            <p className="mt-2 text-lg font-semibold">
              {formatShopDate(order.createdAt, { month: "long", day: "numeric", year: "numeric" })}
            </p>
          ) : order.dueDate ? (
            <>
              <p className="mt-2 text-lg font-semibold">
                {formatShopDate(order.dueDate, { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <p className="text-sm text-on-surface-variant">
                {formatShopTime(order.dueDate)}
                {dueIn !== null && dueIn >= 0 && ` · ${dueIn === 0 ? "today" : dueIn === 1 ? "tomorrow" : `in ${dueIn} days`}`}
              </p>
            </>
          ) : (
            <p className="mt-2 text-lg font-semibold">To be confirmed</p>
          )}
        </div>
        <div className="bg-surface-container-low p-5">
          <p className="spec text-[11px] text-on-surface-variant">Payment</p>
          {total > 0 ? (
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Total</dt>
                <dd className="font-mono font-semibold">{peso(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Paid</dt>
                <dd className="font-mono font-semibold">{peso(paid)}</dd>
              </div>
              <div className="flex justify-between border-t border-outline-variant/40 pt-1.5 text-base">
                <dt className="font-semibold">{balance > 0 ? "Balance to pay" : "Fully paid"}</dt>
                <dd className={cn("font-mono font-bold", balance > 0 ? "text-accent-ink" : "text-success")}>
                  {balance > 0 ? peso(balance) : <Check className="h-5 w-5" />}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-lg font-semibold">Price to be confirmed</p>
          )}
        </div>
      </div>

      {order.items.length > 0 && (
        <section className="mt-8">
          <h2 className="spec mb-3 text-[11px] text-on-surface-variant">What we&apos;re making</h2>
          <ul className="flex flex-wrap gap-2">
            {order.items.map((it, i) => (
              <li key={i} className="border border-outline-variant/60 px-3 py-1.5 text-sm">
                {it.quantity}× {it.productType}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Contact */}
      <section className="mt-10 space-y-3 border-t border-outline-variant/40 pt-8">
        <h2 className="font-headline text-xl font-bold uppercase tracking-[-0.02em]">Questions?</h2>
        <p className="text-sm text-on-surface-variant">
          Mention order #{order.orderNumber} when you message us. Open {SITE.hoursLabel}.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={SITE.phoneHref} className="inline-flex min-h-11 items-center gap-2 border border-outline-variant/60 px-4 text-sm font-semibold hover:border-on-surface-variant">
            <Phone className="h-4 w-4" />
            {SITE.phoneDisplay}
          </a>
          <a
            href={SITE.facebookHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 border border-outline-variant/60 px-4 text-sm font-semibold hover:border-on-surface-variant"
          >
            <MessageCircle className="h-4 w-4" />
            Messenger
          </a>
          <a
            href={SITE.directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 border border-outline-variant/60 px-4 text-sm font-semibold hover:border-on-surface-variant"
          >
            <MapPin className="h-4 w-4" />
            Directions
          </a>
        </div>
        <p className="text-xs text-on-surface-variant">
          {SITE.addressLine1}, {SITE.addressLine2}
        </p>
      </section>
    </main>
  );
}
