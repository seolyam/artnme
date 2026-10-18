"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ORDER_STATUSES, PRODUCT_TYPES, type OrderStatus } from "@/db/schema";
import { updateOrderStatus } from "@/app/actions/orders";
import { OrderCard } from "@/components/dashboard/order-card";
import { SettleDialog } from "@/components/dashboard/settle-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { statusStyle } from "@/lib/order-status";
import { balanceOf } from "@/lib/money";
import { shopDayRange, shopToday } from "@/lib/time";
import { cn } from "@/lib/utils";

export interface BoardOrder {
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

const segBtn = "spec min-h-10 px-3 text-[10px] tracking-[0.08em] transition-colors";

export function KanbanBoard({
  orders,
  staff,
  meId,
  archiveDays,
}: {
  orders: BoardOrder[];
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
  const [due, setDue] = useState<Due>(() => {
    const d = params.get("due");
    return d === "overdue" || d === "today" || d === "week" ? d : "all";
  });
  const staffNames = useMemo(() => new Map(staff.map((s) => [s.id, s.fullName])), [staff]);

  // Mirror the who/due filters into the URL so dashboard links and reloads stick.
  function setParam(key: string, value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value === "all") sp.delete(key);
    else sp.set(key, value);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  function changeWho(next: Who) {
    setWho(next);
    setParam("who", next);
  }
  function changeDue(next: Due) {
    setDue(next);
    setParam("due", next);
  }

  // Local mirror used for optimistic status transitions.
  const [localOrders, setLocalOrders] = useState(orders);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [settleTarget, setSettleTarget] = useState<BoardOrder | null>(null);
  const [, startTransition] = useTransition();

  // Keep local mirror in sync when the server prop changes (e.g. after
  // revalidatePath triggers a re-render with fresh data).
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  function setStatusLocally(orderId: string, status: string) {
    setLocalOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }

  function moveOrder(orderId: string, newStatus: OrderStatus) {
    const previousStatus = localOrders.find((o) => o.id === orderId)?.status ?? newStatus;

    // Optimistic update — move the card immediately.
    setStatusLocally(orderId, newStatus);
    setPendingId(orderId);

    startTransition(async () => {
      try {
        const result = await updateOrderStatus({ orderId, status: newStatus });
        if (result.error) {
          setStatusLocally(orderId, previousStatus);
          toast.error(result.error);
        } else {
          toast.success(`Moved to ${newStatus}`);
        }
      } catch {
        setStatusLocally(orderId, previousStatus);
        toast.error("Couldn't change the status. Check the connection and try again.");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    const target = localOrders.find((o) => o.id === orderId);
    // Completing an unpaid job opens the collect dialog instead.
    if (target && newStatus === "Completed" && balanceOf(target) > 0.009) {
      setSettleTarget(target);
      return;
    }
    moveOrder(orderId, newStatus);
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
  const byStatus = (status: string) => filteredOrders.filter((o) => o.status === status);

  function renderCard(order: BoardOrder) {
    return (
      <>
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
      </>
    );
  }

  return (
    <div className="space-y-4">
      {settleTarget && (
        <SettleDialog
          key={settleTarget.id}
          orderId={settleTarget.id}
          orderNumber={settleTarget.orderNumber}
          balance={balanceOf(settleTarget)}
          open
          onOpenChange={(open) => !open && setSettleTarget(null)}
          hideTrigger
          onSkip={() => moveOrder(settleTarget.id, "Completed")}
          onDone={() => setStatusLocally(settleTarget.id, "Completed")}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            placeholder="Search order #, title or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search the board"
            className="h-10 w-full border border-outline-variant/60 bg-surface-container-lowest pl-9 pr-3 text-sm outline-none focus:border-on-surface-variant"
          />
        </div>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="h-10 w-full rounded-none sm:w-[180px]" aria-label="Product">
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
        <div className="flex flex-wrap gap-0.5 bg-surface-container-high p-0.5" role="group" aria-label="Assigned to">
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
        <div className="flex flex-wrap gap-0.5 bg-surface-container-high p-0.5" role="group" aria-label="Due">
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
              onClick={() => changeDue(value)}
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
              setWho("all");
              setDue("all");
              router.replace(pathname, { scroll: false });
            }}
            className="spec min-h-10 text-[10px] text-on-surface-variant underline-offset-2 hover:text-on-surface hover:underline"
          >
            Clear filters · {filteredOrders.length} shown
          </button>
        )}
      </div>

      {/* Phones: one list grouped by status, no sideways scrolling. */}
      <div className="space-y-3 md:hidden" data-testid="board-list">
        {ORDER_STATUSES.map((status) => (
          <PhoneGroup
            key={status}
            status={status}
            orders={byStatus(status)}
            defaultOpen={status !== "Completed"}
            archiveDays={archiveDays}
            renderCard={renderCard}
          />
        ))}
      </div>

      {/* Tablets and up: columns. Cards share a layoutId, so a status change glides across. */}
      <LayoutGroup>
        <div className="hidden auto-cols-[minmax(250px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4 md:grid" data-testid="board-columns">
          {ORDER_STATUSES.map((status, colIdx) => {
            const statusOrders = byStatus(status);
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
                        {renderCard(order)}
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

function PhoneGroup({
  status,
  orders,
  defaultOpen,
  archiveDays,
  renderCard,
}: {
  status: string;
  orders: BoardOrder[];
  defaultOpen: boolean;
  archiveDays: number;
  renderCard: (order: BoardOrder) => React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const s = statusStyle(status);
  return (
    <section aria-label={status} className={cn("border-l-[3px] bg-surface-container-low", s.rail)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center gap-2 px-3 text-left"
      >
        <span className={cn("h-2 w-2", s.dot)} />
        <h3 className="font-headline text-xs font-bold uppercase tracking-[0.1em]">{status}</h3>
        <span className="spec ml-auto text-[11px] text-on-surface-variant">{orders.length}</span>
        <ChevronDown className={cn("h-4 w-4 text-on-surface-variant transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-2 pb-3">
          {orders.length === 0 ? (
            <p className="spec border border-dashed border-outline-variant/50 px-2 py-5 text-center text-[10px] text-on-surface-variant">
              No jobs here
            </p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="relative">
                {renderCard(order)}
              </div>
            ))
          )}
          {status === "Completed" && (
            <p className="px-1 pt-1 text-[11px] text-on-surface-variant">
              Showing the last {archiveDays} days. Older jobs live on each customer&apos;s page.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
