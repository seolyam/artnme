"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ORDER_STATUSES, PRODUCT_TYPES, type OrderStatus } from "@/db/schema";
import { updateOrderStatus } from "@/app/actions/orders";
import { OrderCard } from "@/components/dashboard/order-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { statusStyle } from "@/lib/order-status";
import { balanceOf } from "@/lib/money";
import { shopDayRange, shopToday } from "@/lib/time";
import { cn } from "@/lib/utils";

interface OrderWithRelations {
  id: string;
  orderNumber: number;
  title: string;
  status: string;
  totalAmount: string;
  depositAmount: string;
  dueDate: Date | null;
  createdAt: Date;
  assignedTo: string | null;
  customer: { id: string; name: string };
  items: { id: string; productType: string; quantity: number }[];
}

type Who = "all" | "me" | "none";
type Due = "all" | "overdue" | "today" | "week";

const segBtn = "spec min-h-9 px-3 text-[10px] tracking-[0.08em] transition-colors";

export function KanbanBoard({
  orders,
  staff,
  meId,
  archiveDays,
}: {
  orders: OrderWithRelations[];
  staff: { id: string; fullName: string }[];
  meId: string;
  archiveDays: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [who, setWho] = useState<Who>(() => {
    const w = params.get("who");
    return w === "me" || w === "none" ? w : "all";
  });
  const [due, setDue] = useState<Due>("all");
  const staffNames = useMemo(() => new Map(staff.map((s) => [s.id, s.fullName])), [staff]);

  // Mirror the "who" filter into the URL so "My jobs" links and reloads stick.
  function changeWho(next: Who) {
    setWho(next);
    const sp = new URLSearchParams(params.toString());
    if (next === "all") sp.delete("who");
    else sp.set("who", next);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  // Local mirror used for optimistic status transitions.
  const [localOrders, setLocalOrders] = useState(orders);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Keep local mirror in sync when the server prop changes (e.g. after
  // revalidatePath triggers a re-render with fresh data).
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    const target = localOrders.find((o) => o.id === orderId);
    const previousStatus = target?.status ?? newStatus;
    const owed = target ? balanceOf(target) : 0;
    if (
      newStatus === "Completed" &&
      owed > 0.009 &&
      !confirm(
        `Order #${target!.orderNumber} still has ₱${owed.toLocaleString("en-PH", { minimumFractionDigits: 2 })} unpaid. Complete it anyway?\n\nTip: open the order and use “Collect & release”.`,
      )
    ) {
      return;
    }

    // Optimistic update — move the card immediately.
    setLocalOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    setPendingId(orderId);

    startTransition(async () => {
      try {
        const result = await updateOrderStatus({ orderId, status: newStatus });
        if (result.error) {
          // Roll back on failure.
          setLocalOrders((prev) =>
            prev.map((o) =>
              o.id === orderId ? { ...o, status: previousStatus } : o,
            ),
          );
          toast.error(result.error);
        } else {
          toast.success(`Moved to "${newStatus}"`);
        }
      } catch {
        setLocalOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: previousStatus } : o,
          ),
        );
        toast.error("Failed to update status. Reverted.");
      } finally {
        setPendingId(null);
      }
    });
  }

  const now = new Date();
  const { end: todayEnd } = shopDayRange(shopToday(now));
  const weekEnd = new Date(todayEnd.getTime() + 6 * 86_400_000);
  const q = search.trim().toLowerCase().replace(/^#/, "");

  const filteredOrders = localOrders.filter((order) => {
    const matchesSearch =
      q === "" ||
      String(order.orderNumber).includes(q) ||
      order.title.toLowerCase().includes(q) ||
      order.customer.name.toLowerCase().includes(q);

    const matchesProduct =
      productFilter === "all" ||
      order.items.some((item) => item.productType === productFilter);

    const matchesWho =
      who === "all" ||
      (who === "me" ? order.assignedTo === meId : !order.assignedTo);

    const dueAt = order.dueDate ? new Date(order.dueDate) : null;
    const open = order.status !== "Completed";
    const matchesDue =
      due === "all" ||
      (open &&
        !!dueAt &&
        (due === "overdue"
          ? dueAt < now
          : due === "today"
            ? dueAt < todayEnd
            : dueAt < weekEnd));

    return matchesSearch && matchesProduct && matchesWho && matchesDue;
  });

  const filtersActive = q !== "" || productFilter !== "all" || who !== "all" || due !== "all";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search #, title or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            {PRODUCT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex gap-0.5 bg-surface-container-high p-0.5" role="group" aria-label="Assigned to">
          {(
            [
              ["all", "Everyone"],
              ["me", "My jobs"],
              ["none", "Unassigned"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={who === value}
              onClick={() => changeWho(value)}
              className={cn(
                segBtn,
                who === value ? "bg-surface-container-lowest text-on-surface" : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-surface-container-high p-0.5" role="group" aria-label="Due">
          {(
            [
              ["all", "Any date"],
              ["overdue", "Overdue"],
              ["today", "Due today"],
              ["week", "This week"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={due === value}
              onClick={() => setDue(value)}
              className={cn(
                segBtn,
                due === value ? "bg-surface-container-lowest text-on-surface" : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setProductFilter("all");
              setDue("all");
              changeWho("all");
            }}
            className="spec text-[10px] text-on-surface-variant underline-offset-2 hover:text-on-surface hover:underline"
          >
            Clear filters · {filteredOrders.length} shown
          </button>
        )}
      </div>

      {/* Board — cards share a layoutId, so a status change glides across columns */}
      <LayoutGroup>
        <div className="grid auto-cols-[minmax(250px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4">
          {ORDER_STATUSES.map((status, colIdx) => {
            const statusOrders = filteredOrders.filter((o) => o.status === status);
            const s = statusStyle(status);
            return (
              <motion.section
                key={status}
                aria-label={status}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: colIdx * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "flex min-h-[420px] min-w-[250px] flex-col border-t-[3px] bg-surface-container-low",
                  s.border,
                )}
              >
                <div className="flex items-center gap-2 px-3 pb-2.5 pt-3">
                  <span className={cn("h-2 w-2", s.dot)} />
                  <h3 className="font-headline text-xs font-bold uppercase tracking-[0.1em]">
                    {status}
                  </h3>
                  <span className="spec ml-auto text-[11px] text-on-surface-variant">
                    {String(statusOrders.length).padStart(2, "0")}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 px-2 pb-3">
                  <AnimatePresence initial={false} mode="popLayout">
                    {statusOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        layoutId={order.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        className="relative"
                      >
                        {pendingId === order.id && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
                            <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />
                          </div>
                        )}
                        <OrderCard
                          order={order}
                          onStatusChange={handleStatusChange}
                          assigneeName={order.assignedTo ? staffNames.get(order.assignedTo) ?? null : null}
                          isMine={order.assignedTo === meId}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {statusOrders.length === 0 && (
                    <p className="spec border border-dashed border-outline-variant/50 px-2 py-8 text-center text-[10px] text-on-surface-variant">
                      No jobs here
                    </p>
                  )}
                  {status === "Completed" && (
                    <p className="mt-auto px-1 pt-2 text-[11px] text-on-surface-variant">
                      Showing the last {archiveDays} days. Older jobs live on each customer&apos;s page.
                    </p>
                  )}
                </div>
              </motion.section>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}