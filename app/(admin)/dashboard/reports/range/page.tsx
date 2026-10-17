import Link from "next/link";
import { Download } from "lucide-react";
import { getRangeReport } from "@/app/actions/reports";
import { ReportTabs } from "@/components/dashboard/report-tabs";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { PrintButton } from "@/components/dashboard/print-button";
import { peso } from "@/lib/money";
import { addShopDays, formatShopDate, shopDayRange, shopToday } from "@/lib/time";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function monthStart(day: string) {
  return `${day.slice(0, 7)}-01`;
}

export default async function RangeReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const r = await getRangeReport(sp.from, sp.to);
  const today = shopToday();
  const label = (d: string) => formatShopDate(shopDayRange(d).start, { month: "short", day: "numeric", year: "numeric" });
  const csv = (type: string) => `/api/reports/csv?type=${type}&from=${r.from}&to=${r.to}`;
  const thisMonth = { from: monthStart(today), to: today };
  const lastMonthEnd = addShopDays(monthStart(today), -1);
  const lastMonth = { from: monthStart(lastMonthEnd), to: lastMonthEnd };
  const quick = [
    ...PRESETS.map((p) => ({ label: p.label, from: addShopDays(today, -(p.days - 1)), to: today })),
    { label: "This month", ...thisMonth },
    { label: "Last month", ...lastMonth },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <ReportTabs current="range" />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="spec mb-2 text-[11px] text-on-surface-variant">Sales by date · {r.days} day{r.days === 1 ? "" : "s"}</p>
          <h1 className="font-headline text-3xl font-bold uppercase leading-none tracking-[-0.04em] md:text-4xl">
            {label(r.from)} – {label(r.to)}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <a
            href={csv("payments")}
            className="inline-flex min-h-10 items-center gap-2 border border-outline-variant/60 px-3 text-sm font-semibold hover:border-on-surface-variant"
          >
            <Download className="h-4 w-4" />
            Payments CSV
          </a>
          <a
            href={csv("orders")}
            className="inline-flex min-h-10 items-center gap-2 border border-outline-variant/60 px-3 text-sm font-semibold hover:border-on-surface-variant"
          >
            <Download className="h-4 w-4" />
            Orders CSV
          </a>
          <PrintButton />
        </div>
      </header>

      {/* One filter row scopes everything below. */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {quick.map((q) => {
          const active = q.from === r.from && q.to === r.to;
          return (
            <Link
              key={q.label}
              href={`/dashboard/reports/range?from=${q.from}&to=${q.to}`}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center border px-3 text-sm font-semibold transition-colors",
                active ? "border-on-surface bg-on-surface text-surface" : "border-outline-variant/60 hover:border-on-surface-variant",
              )}
            >
              {q.label}
            </Link>
          );
        })}
        <form className="flex flex-wrap items-center gap-1.5">
          <input
            type="date"
            name="from"
            defaultValue={r.from}
            max={today}
            aria-label="From"
            className="h-10 border border-outline-variant/60 bg-transparent px-2 text-sm"
          />
          <span className="text-sm text-on-surface-variant">to</span>
          <input
            type="date"
            name="to"
            defaultValue={r.to}
            max={today}
            aria-label="To"
            className="h-10 border border-outline-variant/60 bg-transparent px-2 text-sm"
          />
          <button type="submit" className="h-10 border border-outline-variant/60 px-3 text-sm font-semibold hover:border-on-surface-variant">
            Show
          </button>
        </form>
      </div>

      <div className="grid gap-0.5 border-2 border-surface-container-high bg-surface-container-high sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Collected" sub={`${r.paymentCount} payment${r.paymentCount === 1 ? "" : "s"} · cash in`} value={peso(r.collected)} strong />
        <Tile label="Booked" sub={`${r.orderCount} order${r.orderCount === 1 ? "" : "s"} taken`} value={peso(r.booked)} />
        <Tile label="Completed" sub="Released to customers" value={String(r.completedCount)} />
        <Tile
          label="Average per day"
          sub="Collected ÷ days"
          value={peso(r.days > 0 ? Math.round((r.collected / r.days) * 100) / 100 : 0)}
        />
      </div>

      <section className="bg-surface-container-low p-5 print:break-inside-avoid">
        <h2 className="mb-1 font-headline text-sm font-bold uppercase tracking-[0.04em]">Money per day</h2>
        <p className="mb-4 text-xs text-on-surface-variant">
          Collected is money received (from the payment log). Booked is the value of orders taken that day, paid or not.
        </p>
        <RevenueChart data={r.daily} height={240} />
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <Breakdown title="Collected by method" rows={r.byMethod} empty="No payments." />
        <Breakdown title="Collected by staff" rows={r.byStaff} empty="No payments." />
        <Breakdown
          title="Top customers"
          rows={r.topCustomers.map((c) => ({ name: c.name, amount: c.amount, href: `/dashboard/customers/${c.id}` }))}
          empty="No payments."
        />
      </div>
    </div>
  );
}

function Tile({ label, value, sub, strong }: { label: string; value: string; sub: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-3 bg-surface-container-low p-5">
      <p className="spec text-[11px] text-on-surface-variant">{label}</p>
      <p className={cn("font-headline text-3xl font-bold leading-none tracking-[-0.04em]", strong && "text-accent-ink")}>{value}</p>
      <p className="text-xs text-on-surface-variant">{sub}</p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { name: string; amount: number; href?: string }[];
  empty: string;
}) {
  const total = rows.reduce((s, r) => s + Math.max(0, r.amount), 0);
  return (
    <section className="bg-surface-container-low p-5 print:break-inside-avoid">
      <h2 className="mb-3 font-headline text-sm font-bold uppercase tracking-[0.04em]">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{empty}</p>
      ) : (
        <ul className="space-y-2.5 text-sm">
          {rows.map((r) => (
            <li key={r.name} className="space-y-1">
              <div className="flex justify-between gap-3">
                {r.href ? (
                  <Link href={r.href} className="truncate hover:text-accent-ink">
                    {r.name}
                  </Link>
                ) : (
                  <span className="truncate">{r.name}</span>
                )}
                <span className="shrink-0 font-mono font-semibold tabular-nums">{peso(r.amount)}</span>
              </div>
              {total > 0 && (
                <div className="h-1 bg-surface-container-high" aria-hidden>
                  <div className="h-full bg-on-surface-variant/60" style={{ width: `${Math.max(0, (r.amount / total) * 100)}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
