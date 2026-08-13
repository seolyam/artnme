import { getOrderStats, getRecentOrders } from "@/app/actions/orders";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TopCustomers } from "@/components/dashboard/top-customers";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgClass: string }> = {
  Pending: {
    label: "PENDING",
    color: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 dark:bg-amber-500/10",
  },
  Designing: {
    label: "DESIGNING",
    color: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/10 dark:bg-blue-500/10",
  },
  Printing: {
    label: "PRINTING",
    color: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/10",
  },
  "Ready for Pickup": {
    label: "READY",
    color: "text-primary-container dark:text-primary",
    bgClass: "bg-primary-container/10 dark:bg-primary/10",
  },
  Completed: {
    label: "DONE",
    color: "text-muted-foreground",
    bgClass: "bg-muted/50",
  },
};

export default async function DashboardPage() {
  const [stats, recentOrders, revenueData, topCustomers] = await Promise.all([
    getOrderStats(),
    getRecentOrders(7),
    getRevenueOverTime(),
    getTopCustomers(5),
  ]);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header className="flex flex-col gap-1 pb-2">
        <span
          className="text-xs text-muted-foreground uppercase tracking-[0.25em] font-medium"
          style={{ fontFamily: "var(--font-label)" }}
        >
          OVERVIEW
        </span>
        <h1
          className="text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-none"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          Command Center
        </h1>
      </header>

      {/* ═══════════════════ STATS GRID ═══════════════════ */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Active Runs"
          value={stats.activeOrders}
          icon={ClipboardList}
        />
        <StatCard
          title="Due Today"
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
          title="Revenue Pending"
          subtitle="Total − Deposits"
          value={`₱${stats.pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          icon={Banknote}
        />
        <StatCard
          title="Ready to Go"
          value={stats.readyForPickup}
          icon={PackageCheck}
          highlight={stats.readyForPickup > 0}
        />
      </div>

      {/* ═══════════════════ ANALYTICS ROW ═══════════════════ */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Revenue Chart — spans 2 cols */}
        <section className="lg:col-span-2 bg-surface-container-low p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
            <h2
              className="text-sm font-bold uppercase tracking-tight"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Revenue Pulse
            </h2>
          </div>
          <RevenueChart data={revenueData} />
        </section>

        {/* Top Customers — 1 col */}
        <section className="bg-surface-container-low p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-muted-foreground/60" />
              <h2
                className="text-sm font-bold uppercase tracking-tight"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                Top Clients
              </h2>
            </div>
            <Link
              href="/dashboard/customers"
              prefetch={true}
              className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-medium"
              style={{ fontFamily: "var(--font-label)" }}
            >
              All
            </Link>
          </div>
          <TopCustomers customers={topCustomers} />
        </section>
      </div>

      {/* ═══════════════════ RECENT ORDERS ═══════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2
              className="text-lg font-bold uppercase tracking-tight"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Recent Orders
            </h2>
            <span className="text-xs text-muted-foreground bg-surface-container-high px-2 py-0.5 font-medium" style={{ fontFamily: "var(--font-label)" }}>
              {recentOrders.length}
            </span>
          </div>
          <Link
            href="/dashboard/orders"
            prefetch={true}
            className="group flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            style={{ fontFamily: "var(--font-label)" }}
          >
            View all
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-surface-container-low">
            <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              No orders yet. Create your first order to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {recentOrders.map((order, idx) => {
              const balance =
                parseFloat(order.totalAmount) -
                parseFloat(order.depositAmount);
              const isOverdue =
                order.dueDate &&
                new Date(order.dueDate) < new Date() &&
                order.status !== "Completed";
              const statusCfg = STATUS_CONFIG[order.status] ?? {
                label: order.status.toUpperCase(),
                color: "text-muted-foreground",
                bgClass: "bg-muted/50",
              };

              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.orderNumber}`}
                  prefetch={true}
                  className={`group relative flex items-center justify-between px-4 py-4 transition-all duration-150 hover:bg-surface-container ${
                    idx !== recentOrders.length - 1
                      ? "border-b border-surface-container-high"
                      : ""
                  } ${
                    isOverdue
                      ? "bg-surface-container-low"
                      : "bg-surface-container-lowest dark:bg-surface-container-lowest"
                  }`}
                >
                  {/* Overdue bleeding edge */}
                  {isOverdue && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary-container dark:bg-primary" />
                  )}

                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    {/* Title row */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className="text-[10px] font-bold tabular-nums text-muted-foreground bg-muted/60 px-1.5 py-0.5 shrink-0"
                        style={{ fontFamily: "var(--font-label)" }}
                        title={`Order #${order.orderNumber}`}
                      >
                        #{order.orderNumber}
                      </span>
                      <span className="text-sm font-semibold truncate">
                        {order.title}
                      </span>
                      {/* Status chip */}
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusCfg.color} ${statusCfg.bgClass}`}
                        style={{ fontFamily: "var(--font-label)" }}
                      >
                        {statusCfg.label}
                      </span>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Overdue
                        </span>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-medium">{order.customer.name}</span>
                      {order.dueDate && (
                        <span>
                          Due{" "}
                          {new Date(order.dueDate).toLocaleDateString(
                            "en-PH",
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      )}
                      <span>
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Amount column */}
                  <div className="text-right shrink-0 ml-6">
                    <div className="text-sm font-bold tabular-nums">
                      ₱{parseFloat(order.totalAmount).toLocaleString()}
                    </div>
                    {balance > 0 && (
                      <div className="text-xs text-destructive font-medium tabular-nums">
                        Bal: ₱{balance.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Hover arrow */}
                  <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all ml-2 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STAT CARD — Tonal layered, no shadows, sharp edges
   ═══════════════════════════════════════════════════ */
function StatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  highlight = false,
  variant = "default",
}: {
  title: string;
  subtitle?: string;
  value: string | number;
  icon: LucideIcon;
  highlight?: boolean;
  variant?: "default" | "destructive";
}) {
  const isDestructive = variant === "destructive";

  return (
    <div
      className={`relative flex flex-col gap-3 p-5 transition-colors bg-surface-container-low dark:bg-surface-container-low hover:bg-surface-container dark:hover:bg-surface-container ${
        isDestructive ? "ring-1 ring-destructive/20" : ""
      }`}
    >
      {/* Destructive top accent */}
      {isDestructive && (
        <span className="absolute top-0 left-0 right-0 h-[2px] bg-destructive" />
      )}

      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wider ${
              isDestructive ? "text-destructive" : "text-muted-foreground"
            }`}
            style={{ fontFamily: "var(--font-label)" }}
          >
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <Icon
          className={`h-4 w-4 ${
            isDestructive
              ? "text-destructive"
              : highlight
                ? "text-primary-container dark:text-primary"
                : "text-muted-foreground/50"
          }`}
          strokeWidth={2}
        />
      </div>

      <div
        className={`text-2xl md:text-3xl font-bold tracking-tight leading-none ${
          isDestructive
            ? "text-destructive"
            : highlight
              ? "text-primary-container dark:text-primary"
              : "text-foreground"
        }`}
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {value}
      </div>
    </div>
  );
}
