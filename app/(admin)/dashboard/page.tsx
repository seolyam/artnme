import {
  getCollections,
  getOrderStats,
  getRecentOrders,
  getWebQuoteCount,
  getWorkQueue,
} from "@/app/actions/orders";
import { getMe } from "@/app/actions/staff";
import { ActionQueue } from "@/components/dashboard/action-queue";
import { peso } from "@/lib/money";
import {
  getRevenueOverTime,
  getTopCustomers,
} from "@/app/actions/analytics";
import Link from "next/link";
import {
  ClipboardList,
  Banknote,
  PackageCheck,
  CalendarClock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Crown,
  Plus,
  ListChecks,
  Wallet,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TopCustomers } from "@/components/dashboard/top-customers";
import { CountUp } from "@/components/motion/count-up";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { isWebQuote, statusStyle } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const [stats, recentOrders, revenueData, topCustomers, webQuotes, queue, collections, me] =
    await Promise.all([
      getOrderStats(),
      getRecentOrders(7),
      getRevenueOverTime(),
      getTopCustomers(5),
      getWebQuoteCount(),
      getWorkQueue(),
      getCollections(),
      getMe(),
    ]);
  const firstName = me.fullName.split(/\s+/)[0];

  return (
    <div className="max-w-6xl space-y-6">
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <p className="spec mb-2 text-[11px] text-on-surface-variant">
            Overview ·{" "}
            {new Date().toLocaleDateString("en-PH", {
              weekday: "long",
              month: "long",
              day: "numeric",
              timeZone: "Asia/Manila",
            })}
          </p>
          <h1 className="font-headline text-4xl font-bold uppercase leading-none tracking-[-0.045em] md:text-5xl">
            Command center
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Hi {firstName} —{" "}
            {queue.mine > 0 ? (
              <Link href="/dashboard/orders?who=me" className="font-semibold text-on-surface underline-offset-2 hover:underline">
                {queue.mine} active job{queue.mine === 1 ? " is" : "s are"} on you
              </Link>
            ) : (
              "nothing is assigned to you right now"
            )}
            {queue.unassigned > 0 && (
              <>
                {" · "}
                <Link href="/dashboard/orders?who=none" className="underline-offset-2 hover:underline">
                  {queue.unassigned} unassigned
                </Link>
              </>
            )}
            .
          </p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="ink-fill inline-flex min-h-12 items-center gap-2 bg-brand px-5 font-headline text-xs font-bold uppercase tracking-[0.14em] text-white"
        >
          <Plus className="h-4 w-4" />
          New order
        </Link>
      </header>

      {/* ═══════════════════ WEB QUOTES ═══════════════════ */}
      {webQuotes > 0 && (
        <Reveal immediate y={10}>
          <Link
            href="/dashboard/orders"
            className="group flex flex-wrap items-center gap-4 border border-brand/50 bg-brand/10 px-5 py-4 transition-colors hover:bg-brand/15"
          >
            <span className="relative h-2.5 w-2.5">
              <span className="absolute inset-0 bg-brand" />
              <span className="animate-ping-square absolute inset-0 bg-brand" />
            </span>
            <span className="font-semibold">
              {webQuotes} new web {webQuotes === 1 ? "quote is" : "quotes are"} waiting in Pending.
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 font-headline text-xs font-bold uppercase tracking-[0.12em] text-accent-ink">
              Review
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>
      )}

      {/* ═══════════════════ STATS GRID ═══════════════════ */}
      <Stagger
        stagger={0.06}
        className="grid gap-0.5 border-2 border-surface-container-high bg-surface-container-high sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        <StatCard title="Active runs" value={stats.activeOrders} icon={ClipboardList} />
        <StatCard
          title="Due today"
          value={stats.dueToday}
          icon={CalendarClock}
          highlight={stats.dueToday > 0}
        />
        <StatCard
          title="Overdue"
          value={stats.overdueOrders}
          icon={AlertTriangle}
          variant={stats.overdueOrders > 0 ? "destructive" : "default"}
        />
        <StatCard
          title="Balance due"
          subtitle="Total − deposits"
          value={stats.pendingRevenue}
          peso
          icon={Banknote}
        />
        <StatCard
          title="Ready to go"
          value={stats.readyForPickup}
          icon={PackageCheck}
          highlight={stats.readyForPickup > 0}
        />
      </Stagger>

      {/* ═══════════════════ ACTION QUEUE + DRAWER ═══════════════════ */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal delay={0.06} className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-on-surface-variant" />
            <h2 className="font-headline text-sm font-bold uppercase tracking-[0.04em]">Needs attention</h2>
          </div>
          <ActionQueue queue={queue} />
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-on-surface-variant" />
              <h2 className="font-headline text-sm font-bold uppercase tracking-[0.04em]">Today&apos;s drawer</h2>
            </div>
            <Link
              href="/dashboard/reports"
              className="spec text-[10px] text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Report →
            </Link>
          </div>
          <p className="font-headline text-4xl font-bold leading-none tracking-[-0.04em]">
            {peso(collections.total)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {collections.count} payment{collections.count === 1 ? "" : "s"} collected today
          </p>
          {collections.byMethod.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-outline-variant/30 pt-3 text-sm">
              {collections.byMethod.map((m) => (
                <li key={m.method} className="flex justify-between">
                  <span className="text-on-surface-variant">{m.method}</span>
                  <span className="font-mono font-semibold tabular-nums">{peso(m.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/orders?who=me"
            className="mt-auto flex items-center gap-2 border-t border-outline-variant/30 pt-3 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <UserRound className="h-4 w-4" />
            My jobs
            <span className="spec ml-auto bg-surface-container-high px-1.5 py-0.5 text-[10px]">{queue.mine}</span>
          </Link>
        </Reveal>
      </div>

      {/* ═══════════════════ ANALYTICS ROW ═══════════════════ */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal delay={0.1} className="bg-surface-container-low p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-on-surface-variant" />
            <h2 className="font-headline text-sm font-bold uppercase tracking-[0.04em]">
              Revenue pulse
            </h2>
          </div>
          <RevenueChart data={revenueData} />
        </Reveal>

        <Reveal delay={0.16} className="bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-on-surface-variant" />
              <h2 className="font-headline text-sm font-bold uppercase tracking-[0.04em]">
                Top clients
              </h2>
            </div>
            <Link
              href="/dashboard/customers"
              prefetch={true}
              className="spec text-[10px] text-on-surface-variant transition-colors hover:text-on-surface"
            >
              All →
            </Link>
          </div>
          <TopCustomers customers={topCustomers} />
        </Reveal>
      </div>

      {/* ═══════════════════ RECENT ORDERS ═══════════════════ */}
      <Reveal delay={0.2}>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-headline text-lg font-bold uppercase tracking-tight">
                Recent orders
              </h2>
              <span className="spec bg-surface-container-high px-2 py-0.5 text-[11px] text-on-surface-variant">
                {String(recentOrders.length).padStart(2, "0")}
              </span>
            </div>
            <Link
              href="/dashboard/orders"
              prefetch={true}
              className="spec group flex items-center gap-1.5 text-[11px] text-on-surface-variant transition-colors hover:text-on-surface"
            >
              View board
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="halftone flex flex-col items-center justify-center bg-surface-container-low py-16 [--dot:var(--surface-high)]">
              <p className="bg-background px-4 py-2 text-sm text-on-surface-variant">
                No orders yet. Create your first order to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col border border-outline-variant/30">
              {recentOrders.map((order, idx) => {
                const balance =
                  parseFloat(order.totalAmount) - parseFloat(order.depositAmount);
                const isOverdue =
                  order.dueDate &&
                  new Date(order.dueDate) < new Date() &&
                  order.status !== "Completed";
                const s = statusStyle(order.status);
                const web = isWebQuote(order.title);

                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.orderNumber}`}
                    prefetch={true}
                    className={cn(
                      "group relative flex items-center justify-between bg-surface-container-lowest px-4 py-4 transition-colors hover:bg-surface-container",
                      idx !== recentOrders.length - 1 && "border-b border-outline-variant/30",
                    )}
                  >
                    {isOverdue && (
                      <span className="absolute bottom-0 left-0 top-0 w-[3px] bg-brand" />
                    )}

                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className="spec shrink-0 text-[11px] text-on-surface-variant"
                          title={`Order #${order.orderNumber}`}
                        >
                          #{String(order.orderNumber).padStart(4, "0")}
                        </span>
                        <span className="truncate text-sm font-semibold">{order.title}</span>
                        <span
                          className={cn(
                            "spec inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] tracking-[0.1em]",
                            s.text,
                            s.soft,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5", s.dot)} />
                          {s.short}
                        </span>
                        {web && (
                          <span className="spec border border-brand/60 px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-accent-ink">
                            Web quote
                          </span>
                        )}
                        {isOverdue && (
                          <span className="spec inline-flex items-center gap-1 bg-brand px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-white">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Overdue
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                        <span className="font-medium">{order.customer.name}</span>
                        {order.dueDate && (
                          <span>
                            Due{" "}
                            {new Date(order.dueDate).toLocaleDateString("en-PH", { timeZone: "Asia/Manila",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        <span>
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="ml-6 shrink-0 text-right">
                      <div className="font-mono text-sm font-semibold tabular-nums">
                        ₱{parseFloat(order.totalAmount).toLocaleString()}
                      </div>
                      {balance > 0 && (
                        <div className="font-mono text-xs tabular-nums text-accent-ink">
                          Bal ₱{balance.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <ArrowRight className="ml-2 h-4 w-4 shrink-0 -translate-x-1.5 text-on-surface-variant opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STAT CARD — tonal, sharp edges, numbers count up
   ═══════════════════════════════════════════════════ */
function StatCard({
  title,
  subtitle,
  value,
  peso = false,
  icon: Icon,
  highlight = false,
  variant = "default",
}: {
  title: string;
  subtitle?: string;
  value: number;
  peso?: boolean;
  icon: LucideIcon;
  highlight?: boolean;
  variant?: "default" | "destructive";
}) {
  const isDestructive = variant === "destructive";

  return (
    <StaggerItem className="relative flex flex-col gap-4 bg-surface-container-low p-5 transition-colors hover:bg-surface-container">
      {isDestructive && <span className="absolute left-0 right-0 top-0 h-[3px] bg-brand" />}

      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              "spec text-[11px]",
              isDestructive ? "text-accent-ink" : "text-on-surface-variant",
            )}
          >
            {title}
          </p>
          {subtitle && <p className="mt-0.5 text-[10px] text-on-surface-variant/70">{subtitle}</p>}
        </div>
        <Icon
          className={cn(
            "h-4 w-4",
            isDestructive || highlight ? "text-brand" : "text-on-surface-variant/60",
          )}
          strokeWidth={2}
        />
      </div>

      <div
        className={cn(
          "font-headline text-3xl font-bold leading-none tracking-[-0.04em] md:text-4xl",
          isDestructive || highlight ? "text-accent-ink" : "text-on-surface",
        )}
      >
        {peso && "₱"}
        <CountUp value={value} />
      </div>
    </StaggerItem>
  );
}
