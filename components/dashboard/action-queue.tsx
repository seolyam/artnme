import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarRange,
  CircleDollarSign,
  Inbox,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { QueueOrder } from "@/app/actions/orders";
import { balanceOf, peso } from "@/lib/money";
import { daysUntil, formatShopDate, formatShopTime, timeAgo } from "@/lib/time";
import { statusStyle } from "@/lib/order-status";
import { cn } from "@/lib/utils";

type Queue = {
  overdue: QueueOrder[];
  dueToday: QueueOrder[];
  dueSoon: QueueOrder[];
  readyUnpaid: QueueOrder[];
  staleQuotes: QueueOrder[];
  unpriced: QueueOrder[];
};

type Group = {
  key: keyof Queue;
  title: string;
  hint: string;
  icon: LucideIcon;
  tone: "alert" | "warn" | "calm";
  meta: (o: QueueOrder) => string;
};

const GROUPS: Group[] = [
  {
    key: "overdue",
    title: "Overdue",
    hint: "Past due and not completed",
    icon: AlertTriangle,
    tone: "alert",
    meta: (o) => `${-daysUntil(o.dueDate!) || "<1"}d late · ${o.status}`,
  },
  {
    key: "dueToday",
    title: "Due today",
    hint: "Promised for today",
    icon: CalendarClock,
    tone: "warn",
    meta: (o) => `${formatShopTime(o.dueDate!)} · ${o.status}`,
  },
  {
    key: "readyUnpaid",
    title: "Ready, balance unpaid",
    hint: "Collect before release",
    icon: CircleDollarSign,
    tone: "warn",
    meta: (o) => `${peso(balanceOf(o))} to collect`,
  },
  {
    key: "staleQuotes",
    title: "Web quotes waiting",
    hint: "No reply for over a day",
    icon: Inbox,
    tone: "warn",
    meta: (o) => `Received ${timeAgo(o.createdAt)}`,
  },
  {
    key: "unpriced",
    title: "In production, no price",
    hint: "Add prices before pickup",
    icon: Tag,
    tone: "warn",
    meta: (o) => o.status,
  },
  {
    key: "dueSoon",
    title: "Coming up",
    hint: "Due in the next few days",
    icon: CalendarRange,
    tone: "calm",
    meta: (o) => `${formatShopDate(o.dueDate!, { weekday: "short", month: "short", day: "numeric" })} · ${o.status}`,
  },
];

const PER_GROUP = 4;

export function ActionQueue({ queue }: { queue: Queue }) {
  const groups = GROUPS.filter((g) => queue[g.key].length > 0);

  if (groups.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-surface-container-low px-5 py-6">
        <span className="h-2.5 w-2.5 bg-success" />
        <p className="text-sm">
          <span className="font-semibold">All clear.</span>{" "}
          <span className="text-on-surface-variant">Nothing overdue, unpaid at pickup, or waiting on a reply.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-0.5 bg-surface-container-high md:grid-cols-2">
      {groups.map((g, idx) => {
        const list = queue[g.key];
        const spanRow = groups.length % 2 === 1 && idx === groups.length - 1;
        return (
          <section key={g.key} className={cn("bg-surface-container-low p-4", spanRow && "md:col-span-2")}>
            <header className="mb-2 flex items-center gap-2">
              <g.icon
                className={cn(
                  "h-4 w-4",
                  g.tone === "alert" ? "text-brand" : g.tone === "warn" ? "text-amber-600 dark:text-[#f2b33d]" : "text-on-surface-variant",
                )}
              />
              <h3 className="font-headline text-xs font-bold uppercase tracking-[0.08em]">{g.title}</h3>
              <span
                className={cn(
                  "spec px-1.5 py-0.5 text-[10px]",
                  g.tone === "alert" ? "bg-brand text-white" : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                {list.length}
              </span>
              <span className="ml-auto hidden text-[11px] text-on-surface-variant sm:inline">{g.hint}</span>
            </header>
            <ul className="divide-y divide-outline-variant/30">
              {list.slice(0, PER_GROUP).map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/dashboard/orders/${o.orderNumber}`}
                    className="group flex items-center gap-3 py-2 text-sm"
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0", statusStyle(o.status).dot)} />
                    <span className="spec shrink-0 text-[10px] text-on-surface-variant">
                      #{String(o.orderNumber).padStart(4, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium group-hover:text-accent-ink">{o.title}</span>
                      <span className="block truncate text-xs text-on-surface-variant">
                        {o.customerName} · {g.meta(o)}
                      </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
            {list.length > PER_GROUP && (
              <Link
                href="/dashboard/orders"
                className="spec mt-1 inline-block text-[10px] text-on-surface-variant hover:text-on-surface"
              >
                +{list.length - PER_GROUP} more on the board →
              </Link>
            )}
          </section>
        );
      })}
    </div>
  );
}
