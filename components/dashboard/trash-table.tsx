"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  restoreOrder,
  permanentlyDeleteOrder,
} from "@/app/actions/orders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RotateCcw,
  Trash2,
  AlertTriangle,
  Search,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

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

export function TrashTable({ orders }: { orders: TrashedOrder[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [purgeTarget, setPurgeTarget] = useState<TrashedOrder | null>(null);
  // Capture a stable "now" so date math stays pure during render.
  const [nowMs] = useState(() => Date.now());

  function handleRestore(orderId: string, title: string) {
    startTransition(async () => {
      const result = await restoreOrder(orderId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Restored "${title}"`);
        router.refresh();
      }
    });
  }

  function handlePurge() {
    if (!purgeTarget) return;
    startTransition(async () => {
      const result = await permanentlyDeleteOrder(purgeTarget.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Permanently deleted "${purgeTarget.title}"`);
        setPurgeTarget(null);
        router.refresh();
      }
    });
  }

  const filtered = orders.filter(
    (o) =>
      search === "" ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Trash2 className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            Trash is empty
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Deleted orders will appear here for 30 days before permanent removal.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search deleted orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col">
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No deleted orders match &quot;{search}&quot;.
              </p>
            ) : (
              filtered.map((order, idx) => {
                const deletedDate = order.deletedAt
                  ? new Date(order.deletedAt)
                  : null;
                const daysAgo = deletedDate
                  ? Math.floor(
                      (nowMs - deletedDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null;
                const purgeIn =
                  deletedDate && daysAgo !== null
                    ? Math.max(0, 30 - daysAgo)
                    : null;

                return (
                  <div
                    key={order.id}
                    className={`relative flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between ${
                      idx !== filtered.length - 1
                        ? "border-b border-surface-container-high"
                        : ""
                    } bg-surface-container-low hover:bg-surface-container transition-colors`}
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-bold tabular-nums text-muted-foreground bg-muted/60 px-1.5 py-0.5 shrink-0"
                          title={`Order #${order.orderNumber}`}
                        >
                          #{order.orderNumber}
                        </span>
                        <span className="text-sm font-semibold truncate">
                          {order.title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {order.status}
                        </Badge>
                        {purgeIn !== null && purgeIn <= 7 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-destructive/15 text-destructive">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Purges in {purgeIn}d
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Link
                          href={`/dashboard/customers/${order.customer.id}`}
                          className="font-medium hover:underline"
                        >
                          {order.customer.name}
                        </Link>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""}
                        </span>
                        {deletedDate && (
                          <span>
                            Deleted{" "}
                            {deletedDate.toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {daysAgo !== null && ` (${daysAgo}d ago)`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold tabular-nums mr-2">
                        ₱{parseFloat(order.totalAmount).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(order.id, order.title)}
                        disabled={isPending}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setPurgeTarget(order)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permanent delete confirmation */}
      <Dialog
        open={!!purgeTarget}
        onOpenChange={(open) => !open && setPurgeTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently Delete Order
            </DialogTitle>
            <DialogDescription>
              This will irreversibly remove{" "}
              <span className="font-medium text-foreground">
                {purgeTarget?.title}
              </span>{" "}
              and all its line items from the database. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border-l-4 border-destructive p-3 text-xs text-destructive">
            <p className="font-semibold uppercase tracking-wider mb-1">
              Warning
            </p>
            Financial history for this order will be permanently lost. Consider
            keeping it in trash instead.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPurgeTarget(null)}
              disabled={isPending}
            >
              Keep in Trash
            </Button>
            <Button
              variant="destructive"
              onClick={handlePurge}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
