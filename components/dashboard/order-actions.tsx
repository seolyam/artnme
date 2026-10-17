"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  updateOrderStatus,
  deleteOrder,
} from "@/app/actions/orders";
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
import { MoreHorizontal, Trash2, Pencil, Printer, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { nextStatus } from "@/lib/order-status";

export function OrderActions({
  orderId,
  orderNumber,
  currentStatus,
  balance = 0,
  isAdmin = false,
}: {
  orderId: string;
  orderNumber: number;
  currentStatus: string;
  balance?: number;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const next = nextStatus(currentStatus);

  function handleStatusChange(newStatus: OrderStatus) {
    if (
      newStatus === "Completed" &&
      balance > 0.009 &&
      !confirm(
        `This order still has ₱${balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })} unpaid. Complete it anyway?\n\nTip: use “Collect & release” to take the balance and complete in one step.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await updateOrderStatus({
        orderId,
        status: newStatus,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Status changed to "${newStatus}"`);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (
      !confirm(
        "Move this order to trash? An admin can restore it from the Trash.",
      )
    )
      return;
    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Order moved to trash");
        router.push("/dashboard/orders");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next && next !== "Completed" && (
        <Button
          size="sm"
          className="rounded-none"
          disabled={isPending}
          onClick={() => handleStatusChange(next)}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Move to {next}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      )}
      <Button variant="outline" size="sm" asChild className="rounded-none">
        <a href={`/dashboard/orders/${orderNumber}/print`} target="_blank" rel="noopener noreferrer">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild className="rounded-none">
        <Link href={`/dashboard/orders/${orderNumber}/edit`}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending} className="rounded-none" aria-label="More actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Set status</DropdownMenuLabel>
          {ORDER_STATUSES.filter((s) => s !== currentStatus).map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
            >
              Move to {status}
            </DropdownMenuItem>
          ))}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Move to trash
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
