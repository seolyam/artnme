"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateOrderStatus, deleteOrder } from "@/app/actions/orders";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Pencil, Printer, ChevronRight, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { TRASH_RETENTION_DAYS, nextStatus, statusStyle } from "@/lib/order-status";
import { useConfirm } from "@/components/dashboard/confirm-dialog";
import { SettleDialog } from "@/components/dashboard/settle-dialog";
import { cn } from "@/lib/utils";

export function OrderActions({
  orderId,
  orderNumber,
  currentStatus,
  balance = 0,
  isAdmin = false,
  orderAgainHref,
}: {
  orderId: string;
  orderNumber: number;
  currentStatus: string;
  balance?: number;
  isAdmin?: boolean;
  /** "Order again" starts a new order prefilled from this one. */
  orderAgainHref?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [settleOpen, setSettleOpen] = useState(false);
  const { confirm, dialog } = useConfirm();
  const next = nextStatus(currentStatus);

  function moveTo(newStatus: OrderStatus) {
    startTransition(async () => {
      const result = await updateOrderStatus({ orderId, status: newStatus });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Moved to ${newStatus}`);
        router.refresh();
      }
    });
  }

  function handleStatusChange(newStatus: OrderStatus) {
    // Completing an unpaid job goes through the collect dialog, which also
    // offers "complete without collecting" for the rare case it's intended.
    if (newStatus === "Completed" && balance > 0.009) {
      setSettleOpen(true);
      return;
    }
    moveTo(newStatus);
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `Move order #${orderNumber} to the trash?`,
      description: (
        <p>
          It disappears from the board and reports. An admin can restore it from the Trash within {TRASH_RETENTION_DAYS} days; after
          that it&apos;s deleted for good.
        </p>
      ),
      confirmLabel: "Move to trash",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Order #${orderNumber} moved to the trash`);
        router.push("/dashboard/orders");
      }
    });
  }

  const btn = "min-h-10 rounded-none";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {dialog}
      <SettleDialog
        orderId={orderId}
        orderNumber={orderNumber}
        balance={balance}
        open={settleOpen}
        onOpenChange={setSettleOpen}
        hideTrigger
        onSkip={() => moveTo("Completed")}
      />
      {next && next !== "Completed" && (
        <Button className={btn} disabled={isPending} onClick={() => handleStatusChange(next)}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Move to {next}
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      <Button variant="outline" asChild className={btn}>
        <Link href={`/dashboard/orders/${orderNumber}/edit`}>
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      </Button>
      <Button variant="outline" asChild className={btn}>
        <a href={`/dashboard/orders/${orderNumber}/print`} target="_blank" rel="noopener noreferrer">
          <Printer className="h-4 w-4" />
          Print
        </a>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isPending} className={cn(btn, "w-10 px-0")} aria-label="More actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52 rounded-none">
          <DropdownMenuLabel className="spec text-[10px] text-on-surface-variant">Change status</DropdownMenuLabel>
          {ORDER_STATUSES.filter((s) => s !== currentStatus).map((status) => (
            <DropdownMenuItem key={status} className="min-h-9 rounded-none" onClick={() => handleStatusChange(status)}>
              <span className={cn("h-2 w-2", statusStyle(status).dot)} />
              Move to {status}
            </DropdownMenuItem>
          ))}
          {orderAgainHref && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="min-h-9 rounded-none">
                <Link href={orderAgainHref}>
                  <Copy className="h-4 w-4" />
                  Order again (copy items)
                </Link>
              </DropdownMenuItem>
            </>
          )}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="min-h-9 rounded-none text-accent-ink focus:text-accent-ink"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Move to trash
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
