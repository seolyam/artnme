import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "daily", label: "Daily", href: "/dashboard/reports" },
  { key: "range", label: "Sales by date", href: "/dashboard/reports/range" },
  { key: "receivables", label: "Unpaid balances", href: "/dashboard/reports/receivables" },
] as const;

export function ReportTabs({ current }: { current: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="Reports" className="flex gap-0.5 overflow-x-auto bg-surface-container-high p-0.5 print:hidden">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={current === t.key ? "page" : undefined}
          className={cn(
            "spec flex min-h-10 shrink-0 items-center px-4 text-[10px] tracking-[0.08em] transition-colors",
            current === t.key ? "bg-surface-container-lowest text-on-surface" : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
