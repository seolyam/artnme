"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Package, RotateCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { emptyTrash, permanentlyDeleteOrder, restoreOrder } from "@/app/actions/orders";
import { useConfirm } from "@/components/dashboard/confirm-dialog";
import { StatusChip } from "@/components/dashboard/status-chip";
import { TRASH_RETENTION_DAYS } from "@/lib/order-status";
import { peso } from "@/lib/money";
import { formatShopDate } from "@/lib/time";
import { cn } from "@/lib/utils";

interface TrashedOrder {
  id: string;
  orderNumber: number;
  title: string;
  status: string;
  totalAmount: string;
  deletedAt: Date | null;
  createdAt: Date;
  customer: { id: string; name: string };
  items: { id: string; productType: string; quantity: number }[];
}

const DAY_MS = 86_400_000;

export function TrashTable({ orders }: { orders: TrashedOrder[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { confirm, dialog } = useConfirm();
  // Capture a stable "now" so date math stays pure during render.
  const [nowMs] = useState(() => Date.now());

  function handleRestore(order: TrashedOrder) {
    setBusyId(order.id);
    startTransition(async () => {
      const result = await restoreOrder(order.id);
      setBusyId(null);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Order #${order.orderNumber} is back on the board`);
        router.refresh();
      }
    });
  }

  async function handlePurge(order: TrashedOrder) {
    const ok = await confirm({
      title: `Delete order #${order.orderNumber} forever?`,
      description: (
        <>
          <p>
            <span className="font-semibold text-on-surface">{order.title}</span> for {order.customer.name},
            with its items, payments and history, will be erased. This can&apos;t be undone.
          </p>
          <p className="mt-2">If you might need it again, leave it here or press Restore instead.</p>
        </>
      ),
      confirmLabel: "Delete forever",
      cancelLabel: "Keep it",
      tone: "danger",
    });
    if (!ok) return;

    setBusyId(order.id);
    startTransition(async () => {
      const result = await permanentlyDeleteOrder(order.id);
      setBusyId(null);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Order #${order.orderNumber} deleted for good`);
        router.refresh();
      }
    });
  }

  async function handleEmpty() {
    const ok = await confirm({
      title: `Empty the trash?`,
      description: (
        <p>
          All {orders.length} order{orders.length === 1 ? "" : "s"} in the trash, with their payments and
          history, will be erased now instead of after {TRASH_RETENTION_DAYS} days. This can&apos;t be undone.
        </p>
      ),
      confirmLabel: `Delete all ${orders.length}`,
      cancelLabel: "Keep them",
      tone: "danger",
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await emptyTrash();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Trash emptied · ${result.count} order${result.count === 1 ? "" : "s"} deleted`);
        router.refresh();
      }
    });
  }

  const q = search.trim().toLowerCase().replace(/^#/, "");
  const filtered = orders.filter(
    (o) =>
      q === "" ||
      String(o.orderNumber).includes(q) ||
      o.title.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q),
  );

  if (orders.length === 0) {
    return (
      <div className="halftone flex flex-col items-center justify-center bg-surface-container-low py-20 [--dot:var(--surface-high)]">
        <div className="bg-background px-5 py-4 text-center">
          <Trash2 className="mx-auto mb-2 h-6 w-6 text-on-surface-variant/60" />
          <p className="font-semibold">The trash is empty</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Deleted orders wait here for {TRASH_RETENTION_DAYS} days before they&apos;re removed for good.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {dialog}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            placeholder="Search order #, title or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search deleted orders"
            className="h-10 w-full border border-outline-variant/60 bg-surface-container-lowest pl-9 pr-3 text-sm outline-none focus:border-on-surface-variant"
          />
        </div>
        <button
          type="button"
          onClick={handleEmpty}
          disabled={isPending}
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-brand/60 px-4 text-sm font-semibold text-accent-ink transition-colors hover:bg-brand hover:text-white disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Empty trash
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">
          No deleted orders match &ldquo;{search}&rdquo;.
        </p>
      ) : (
        <ul className="divide-y divide-outline-variant/30 border border-outline-variant/30">
          {filtered.map((order) => {
            const deletedAt = order.deletedAt ? new Date(order.deletedAt) : null;
            const purgeAt = deletedAt ? new Date(deletedAt.getTime() + TRASH_RETENTION_DAYS * DAY_MS) : null;
            const daysLeft = purgeAt ? Math.max(0, Math.ceil((purgeAt.getTime() - nowMs) / DAY_MS)) : null;
            const busy = busyId === order.id;

            return (
              <li
                key={order.id}
                className={cn(
                  "flex flex-col gap-3 bg-surface-container-lowest p-4 md:flex-row md:items-center md:justify-between",
                  busy && "opacity-60",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="spec shrink-0 text-[11px] text-on-surface-variant">
                      #{String(order.orderNumber).padStart(4, "0")}
                    </span>
                    <span className="min-w-0 truncate text-sm font-semibold">{order.title}</span>
                    <StatusChip status={order.status} />
                    {daysLeft !== null && daysLeft <= 7 && (
                      <span className="spec bg-brand px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-white">
                        {daysLeft === 0 ? "Deletes today" : `Deletes in ${daysLeft}d`}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                    <Link href={`/dashboard/customers/${order.customer.id}`} className="font-medium hover:text-on-surface">
                      {order.customer.name}
                    </Link>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </span>
                    {deletedAt && <span>Deleted {formatShopDate(deletedAt, { month: "short", day: "numeric", year: "numeric" })}</span>}
                    {purgeAt && daysLeft !== null && daysLeft > 7 && (
                      <span>Removed for good on {formatShopDate(purgeAt, { month: "short", day: "numeric" })}</span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="mr-2 font-mono text-sm font-semibold tabular-nums">{peso(order.totalAmount)}</span>
                  <button
                    type="button"
                    onClick={() => handleRestore(order)}
                    disabled={isPending}
                    className="inline-flex min-h-10 items-center gap-1.5 bg-on-surface px-4 font-headline text-[11px] font-bold uppercase tracking-[0.1em] text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePurge(order)}
                    disabled={isPending}
                    className="inline-flex min-h-10 items-center gap-1.5 border border-outline-variant/60 px-3 text-xs font-semibold text-on-surface-variant transition-colors hover:border-brand hover:text-accent-ink disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete forever
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
