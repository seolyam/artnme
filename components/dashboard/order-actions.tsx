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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Pencil, Printer } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function OrderActions({
  orderId,
  orderNumber,
  currentStatus,
}: {
  orderId: string;
  orderNumber: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: OrderStatus) {
    startTransition(async () => {
      const result = await updateOrderStatus({
        orderId,
        status: newStatus,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Status changed to "${newStatus}"`);
      }
    });
  }

  function handleDelete() {
    if (
      !confirm(
        "Move this order to trash? You can restore it from the Trash for up to 30 days.",
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
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href={`/dashboard/orders/${orderNumber}/print`} target="_blank" rel="noopener noreferrer">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/orders/${orderNumber}/edit`}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending}>
            <MoreHorizontal className="mr-2 h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {ORDER_STATUSES.filter((s) => s !== currentStatus).map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
            >
              Move to {status}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
