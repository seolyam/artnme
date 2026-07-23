import Link from "next/link";
import { TrendingUp } from "lucide-react";

interface TopCustomer {
  id: string;
  name: string;
  orderCount: number;
  totalSpent: number;
}

export function TopCustomers({ customers }: { customers: TopCustomer[] }) {
  const maxSpent = customers.reduce(
    (max, c) => (c.totalSpent > max ? c.totalSpent : max),
    0,
  );

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <TrendingUp className="h-7 w-7 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          No top customers yet.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Your busiest clients will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {customers.map((c, idx) => {
        const pct = maxSpent > 0 ? (c.totalSpent / maxSpent) * 100 : 0;
        return (
          <Link
            key={c.id}
            href={`/dashboard/customers/${c.id}`}
            prefetch={true}
            className="group relative flex items-center gap-3 px-3 py-3 transition-colors hover:bg-surface-container"
          >
            <span
              className="w-5 text-xs font-bold text-muted-foreground tabular-nums"
              style={{ fontFamily: "var(--font-label)" }}
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold truncate">{c.name}</span>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-primary-container dark:bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0 w-24">
              <span className="text-sm font-bold tabular-nums">
                ₱{c.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
