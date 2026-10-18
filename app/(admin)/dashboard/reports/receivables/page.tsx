import Link from "next/link";
import { Banknote, Download, MessageSquareText } from "lucide-react";
import { getReceivables } from "@/app/actions/reports";
import { ReportTabs } from "@/components/dashboard/report-tabs";
import { StatusChip } from "@/components/dashboard/status-chip";
import { RecordDepositDialog } from "@/components/dashboard/record-deposit-dialog";
import { peso, roundMoney } from "@/lib/money";
import { dialable, formatContact, isPhMobile } from "@/lib/phone";
import { AGE_BUCKETS, ageBucket } from "@/lib/report-range";
import { formatShopDate } from "@/lib/time";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export default async function ReceivablesPage() {
  const rows = await getReceivables();
  const total = roundMoney(rows.reduce((s, r) => s + r.balance, 0));
  const buckets = AGE_BUCKETS.map((b) => {
    const list = rows.filter((r) => ageBucket(r.ageDays).key === b.key);
    return { ...b, count: list.length, amount: roundMoney(list.reduce((s, r) => s + r.balance, 0)) };
  });

  return (
    <div className="max-w-5xl space-y-6">
      <ReportTabs current="receivables" />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="spec mb-2 text-[11px] text-on-surface-variant">
            Unpaid balances · {rows.length} order{rows.length === 1 ? "" : "s"}
          </p>
          <h1 className="font-headline text-3xl font-bold uppercase leading-none tracking-[-0.04em] md:text-4xl">
            {peso(total)} to collect
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            Every order that isn&apos;t fully paid, oldest first. Record a payment right here, or text the customer a
            reminder.
          </p>
        </div>
        <a
          href="/api/reports/csv?type=receivables"
          className="inline-flex min-h-10 items-center gap-2 border border-outline-variant/60 px-3 text-sm font-semibold hover:border-on-surface-variant print:hidden"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </a>
      </header>

      <div className="grid grid-cols-2 gap-0.5 border-2 border-surface-container-high bg-surface-container-high lg:grid-cols-4">
        {buckets.map((b) => (
          <div key={b.key} className="relative flex flex-col gap-2 bg-surface-container-low p-4 md:p-5">
            {b.key === "old" && b.count > 0 && <span className="absolute left-0 right-0 top-0 h-[3px] bg-brand" />}
            <p className="spec text-[11px] text-on-surface-variant">{b.label}</p>
            <p className={cn("font-headline text-2xl font-bold leading-none tracking-[-0.04em]", b.key === "old" && b.count > 0 && "text-accent-ink")}>
              {peso(b.amount, false)}
            </p>
            <p className="text-xs text-on-surface-variant">
              {b.count} order{b.count === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center gap-3 bg-surface-container-low px-5 py-8">
          <span className="h-2.5 w-2.5 bg-success" />
          <p className="text-sm">
            <span className="font-semibold">Everyone has paid.</span>{" "}
            <span className="text-on-surface-variant">No order has a balance left.</span>
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-outline-variant/30 border border-outline-variant/30">
          {rows.map((r) => {
            const reminder = `Hi ${r.customerName.split(/\s+/)[0]}! Friendly reminder that order #${r.orderNumber} (${r.title}) has a remaining balance of ${peso(r.balance)}. You can pay via GCash (${SITE.phoneDisplay}) or at the studio. Thank you! — ${SITE.name}`;
            const old = r.ageDays > 30;
            return (
              <li key={r.id} className="relative flex flex-col gap-3 bg-surface-container-lowest p-4 md:flex-row md:items-center">
                {r.ageDays > 60 && <span className="absolute bottom-0 left-0 top-0 w-[3px] bg-brand" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/orders/${r.orderNumber}`} className="spec text-[11px] text-on-surface-variant hover:text-on-surface">
                      #{String(r.orderNumber).padStart(4, "0")}
                    </Link>
                    <Link href={`/dashboard/orders/${r.orderNumber}`} className="truncate text-sm font-semibold hover:text-accent-ink">
                      {r.title}
                    </Link>
                    <StatusChip status={r.status} />
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    <Link href={`/dashboard/customers/${r.customerId}`} className="font-medium hover:text-on-surface">
                      {r.customerName}
                    </Link>
                    {r.contactNumber && ` · ${formatContact(r.contactNumber)}`}
                    {" · "}
                    <span className={cn(old && "font-semibold text-accent-ink")}>
                      ordered {formatShopDate(r.createdAt, { month: "short", day: "numeric", year: "numeric" })} ({r.ageDays}d ago)
                    </span>
                    {r.lastPaymentAt
                      ? ` · last paid ${formatShopDate(r.lastPaymentAt, { month: "short", day: "numeric" })}`
                      : " · nothing paid yet"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="mr-2 text-right font-mono text-sm tabular-nums">
                    <div className="font-bold text-accent-ink">{peso(r.balance)}</div>
                    <div className="text-xs text-on-surface-variant">of {peso(r.totalAmount)}</div>
                  </div>
                  {isPhMobile(r.contactNumber) && (
                    <a
                      href={`sms:${dialable(r.contactNumber)}?body=${encodeURIComponent(reminder)}`}
                      className="inline-flex min-h-10 items-center gap-1.5 border border-outline-variant/60 px-3 text-xs font-semibold hover:border-on-surface-variant"
                    >
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Text reminder
                    </a>
                  )}
                  <RecordDepositDialog
                    orderId={r.id}
                    orderNumber={r.orderNumber}
                    currentDeposit={r.depositAmount}
                    totalAmount={r.totalAmount}
                    orderTitle={r.title}
                    trigger={
                      <button type="button" className="inline-flex min-h-10 items-center gap-1.5 bg-on-surface px-3 text-xs font-semibold text-surface">
                        <Banknote className="h-3.5 w-3.5" />
                        Record payment
                      </button>
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
