"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CornerDownLeft,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  Loader2,
  Plus,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { searchEverything, type SearchResults } from "@/app/actions/search";
import { statusStyle } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export const OPEN_PALETTE_EVENT = "open-command-palette";

type Item = {
  key: string;
  group: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  href: string;
  dot?: string;
};

const QUICK: Item[] = [
  { key: "q-new", group: "Go to", label: "New order", icon: Plus, href: "/dashboard/orders/new" },
  { key: "q-board", group: "Go to", label: "Orders board", icon: KanbanSquare, href: "/dashboard/orders" },
  { key: "q-mine", group: "Go to", label: "My jobs", icon: UserRound, href: "/dashboard/orders?who=me" },
  { key: "q-home", group: "Go to", label: "Command center", icon: LayoutDashboard, href: "/dashboard" },
  { key: "q-cust", group: "Go to", label: "Customers", icon: Users, href: "/dashboard/customers" },
  { key: "q-report", group: "Go to", label: "Daily report", icon: FileText, href: "/dashboard/reports" },
  { key: "q-range", group: "Go to", label: "Sales report (date range)", icon: FileText, href: "/dashboard/reports/range" },
  { key: "q-owed", group: "Go to", label: "Unpaid balances", icon: FileText, href: "/dashboard/reports/receivables" },
  { key: "q-prices", group: "Go to", label: "Price list", icon: FileText, href: "/dashboard/prices" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ orders: [], customers: [] });
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  // Debounced server search; stale responses are dropped by request id.
  useEffect(() => {
    const q = query.trim();
    // An empty query shows the quick links and ignores `results` entirely.
    if (!q) return;
    const id = ++requestId.current;
    const t = setTimeout(() => {
      startTransition(async () => {
        const r = await searchEverything(q);
        if (id === requestId.current) {
          setResults(r);
          setActive(0);
        }
      });
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  const items: Item[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK;
    const orderItems: Item[] = results.orders.map((o) => ({
      key: `o-${o.orderNumber}`,
      group: "Orders",
      label: `#${String(o.orderNumber).padStart(4, "0")} · ${o.title}`,
      hint: o.customerName,
      icon: KanbanSquare,
      href: `/dashboard/orders/${o.orderNumber}`,
      dot: statusStyle(o.status).dot,
    }));
    const customerItems: Item[] = results.customers.map((c) => ({
      key: `c-${c.id}`,
      group: "Customers",
      label: c.name,
      hint: c.contactNumber ?? undefined,
      icon: Users,
      href: `/dashboard/customers/${c.id}`,
    }));
    const quick = QUICK.filter((i) => i.label.toLowerCase().includes(q));
    return [...orderItems, ...customerItems, ...quick];
  }, [query, results]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (item: Item) => {
      close();
      router.push(item.href);
    },
    [close, router],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[active];
      if (item) go(item);
      else if (/^#?\d+$/.test(query.trim())) {
        close();
        router.push(`/dashboard/orders/${query.trim().replace("#", "")}`);
      }
    }
  }

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] translate-y-0 gap-0 overflow-hidden rounded-none p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-3 border-b border-outline-variant/40 px-4">
          {pending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-on-surface-variant" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-on-surface-variant" />
          )}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Order #, title, customer or phone…"
            aria-label="Search orders and customers"
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-on-surface-variant/70"
          />
          <kbd className="spec hidden shrink-0 border border-outline-variant/60 px-1.5 py-0.5 text-[10px] text-on-surface-variant sm:block">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2" role="listbox">
          {items.length === 0 && !pending && (
            <p className="px-4 py-8 text-center text-sm text-on-surface-variant">
              No matches for “{query}”.
            </p>
          )}
          {items.map((item, i) => {
            const header = i === 0 || items[i - 1].group !== item.group ? item.group : null;
            return (
              <div key={item.key}>
                {header && (
                  <p className="spec px-4 pb-1 pt-3 text-[10px] text-on-surface-variant">{header}</p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm",
                    i === active ? "bg-surface-container-high" : "",
                  )}
                >
                  {item.dot ? (
                    <span className={cn("h-2 w-2 shrink-0", item.dot)} />
                  ) : (
                    <item.icon className="h-4 w-4 shrink-0 text-on-surface-variant" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                  {item.hint && (
                    <span className="max-w-[40%] truncate text-xs text-on-surface-variant">{item.hint}</span>
                  )}
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" />}
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
