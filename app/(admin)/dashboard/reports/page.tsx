import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCollections, getDayActivity } from "@/app/actions/orders";
import { PrintButton } from "@/components/dashboard/print-button";
import { peso, toNumber } from "@/lib/money";
import { formatShopDate, formatShopTime, shopDayRange, shopToday } from "@/lib/time";
import { cn } from "@/lib/utils";

function shiftDay(day: string, by: number) {
  const { start } = shopDayRange(day);
  return shopToday(new Date(start.getTime() + by * 86_400_000 + 12 * 3_600_000));
}

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const sp = await searchParams;
  const today = shopToday();
  const day = sp.day && /^\d{4}-\d{2}-\d{2}$/.test(sp.day) && sp.day <= today ? sp.day : today;

  const [collections, activity] = await Promise.all([getCollections(day), getDayActivity(day)]);
  const label = formatShopDate(shopDayRange(day).start, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const cashTotal = collections.byMethod.find((m) => m.method === "Cash")?.amount ?? 0;

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="spec mb-2 text-[11px] text-on-surface-variant">Daily report</p>
          <h1 className="font-headline text-3xl font-bold uppercase leading-none tracking-[-0.04em] md:text-4xl">
            {day === today ? "Today" : label}
          </h1>
          {day === today && <p className="mt-1 text-sm text-on-surface-variant">{label}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Link
            href={`/dashboard/reports?day=${shiftDay(day, -1)}`}
            aria-label="Previous day"
            className="flex h-10 w-10 items-center justify-center border border-outline-variant/60 hover:border-on-surface-variant"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <form className="flex">
            <input
              type="date"
              name="day"
              defaultValue={day}
              max={today}
              aria-label="Report date"
              className="h-10 border border-outline-variant/60 bg-transparent px-3 text-sm"
            />
            <button type="submit" className="h-10 border border-l-0 border-outline-variant/60 px-3 text-xs font-semibold">
              Go
            </button>
          </form>
          {day < today && (
            <Link
              href={`/dashboard/reports?day=${shiftDay(day, 1)}`}
              aria-label="Next day"
              className="flex h-10 w-10 items-center justify-center border border-outline-variant/60 hover:border-on-surface-variant"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          <PrintButton />
        </div>
      </header>

      {/* Totals */}
      <div className="grid gap-0.5 border-2 border-surface-container-high bg-surface-container-high sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Collected" value={peso(collections.total)} sub={`${collections.count} payment${collections.count === 1 ? "" : "s"}`} strong />
        <Tile label="Cash in drawer" value={peso(cashTotal)} sub="Cash payments only" />
        <Tile label="New orders" value={String(activity.created.length)} sub={peso(activity.created.reduce((s, o) => s + toNumber(o.totalAmount), 0)) + " booked"} />
        <Tile label="Completed" value={String(activity.completed.length)} sub="Released to customers" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="By method">
          {collections.byMethod.length === 0 ? (
            <Empty>No payments.</Empty>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {collections.byMethod.map((m) => (
                <li key={m.method} className="flex justify-between">
                  <span>{m.method}</span>
                  <span className="font-mono font-semibold tabular-nums">{peso(m.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="By staff">
          {collections.byStaff.length === 0 ? (
            <Empty>No payments.</Empty>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {collections.byStaff.map((m) => (
                <li key={m.name} className="flex justify-between">
                  <span>{m.name}</span>
                  <span className="font-mono font-semibold tabular-nums">{peso(m.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Payments">
        {collections.payments.length === 0 ? (
          <Empty>Nothing collected on this day.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="spec border-b border-outline-variant/40 text-[10px] text-on-surface-variant">
                  <th className="py-2 pr-3 font-normal">Time</th>
                  <th className="py-2 pr-3 font-normal">Order</th>
                  <th className="py-2 pr-3 font-normal">Customer</th>
                  <th className="py-2 pr-3 font-normal">Method</th>
                  <th className="py-2 pr-3 font-normal">By</th>
                  <th className="py-2 text-right font-normal">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/25">
                {collections.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3 font-mono text-xs">{formatShopTime(p.createdAt)}</td>
                    <td className="py-2 pr-3">
                      <Link href={`/dashboard/orders/${p.orderNumber}`} className="hover:text-accent-ink">
                        <span className="spec mr-1.5 text-[10px] text-on-surface-variant">#{p.orderNumber}</span>
                        <span className="font-medium">{p.orderTitle}</span>
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{p.customerName}</td>
                    <td className="py-2 pr-3">
                      {p.method}
                      {p.reference && <span className="ml-1 font-mono text-xs text-on-surface-variant">#{p.reference}</span>}
                    </td>
                    <td className="py-2 pr-3 text-on-surface-variant">{p.receivedByName ?? "—"}</td>
                    <td
                      className={cn(
                        "py-2 text-right font-mono font-semibold tabular-nums",
                        toNumber(p.amount) < 0 && "text-accent-ink",
                      )}
                    >
                      {peso(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-outline-variant/50">
                  <td colSpan={5} className="py-2 font-semibold">Total</td>
                  <td className="py-2 text-right font-mono font-bold tabular-nums">{peso(collections.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="New orders">
          <OrderList rows={activity.created.map((o) => ({ ...o, right: peso(o.totalAmount) }))} empty="No new orders." />
        </Section>
        <Section title="Completed">
          <OrderList
            rows={activity.completed.map((o) => {
              const owed = toNumber(o.totalAmount) - toNumber(o.depositAmount);
              return { ...o, right: owed > 0.009 ? `${peso(owed)} unpaid` : "Paid" };
            })}
            empty="Nothing released."
          />
        </Section>
      </div>
    </div>
  );
}

function Tile({ label, value, sub, strong }: { label: string; value: string; sub: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-3 bg-surface-container-low p-5">
      <p className="spec text-[11px] text-on-surface-variant">{label}</p>
      <p className={cn("font-headline text-3xl font-bold leading-none tracking-[-0.04em]", strong && "text-accent-ink")}>
        {value}
      </p>
      <p className="text-xs text-on-surface-variant">{sub}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-low p-5 print:break-inside-avoid">
      <h2 className="mb-3 font-headline text-sm font-bold uppercase tracking-[0.04em]">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-on-surface-variant">{children}</p>;
}

function OrderList({
  rows,
  empty,
}: {
  rows: { orderNumber: number; title: string; customerName: string; right: string }[];
  empty: string;
}) {
  if (rows.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-outline-variant/25 text-sm">
      {rows.map((o) => (
        <li key={o.orderNumber}>
          <Link href={`/dashboard/orders/${o.orderNumber}`} className="flex items-center gap-3 py-2 hover:text-accent-ink">
            <span className="spec text-[10px] text-on-surface-variant">#{o.orderNumber}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{o.title}</span>
              <span className="block truncate text-xs text-on-surface-variant">{o.customerName}</span>
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums">{o.right}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
