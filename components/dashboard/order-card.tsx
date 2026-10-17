"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Calendar, User, ChevronRight, AlertTriangle } from "lucide-react";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { isWebQuote } from "@/lib/order-status";
import { cn } from "@/lib/utils";

interface OrderCardOrder {
  id: string;
  orderNumber: number;
  title: string;
  status: string;
  totalAmount: string;
  depositAmount: string;
  dueDate: Date | null;
  customer: { name: string };
  items: { productType: string; quantity: number }[];
}

interface OrderCardProps {
  order: OrderCardOrder;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

const STATUS_SEQUENCE: OrderStatus[] = [...ORDER_STATUSES];

function getNextStatus(current: string): OrderStatus | null {
  const idx = STATUS_SEQUENCE.indexOf(current as OrderStatus);
  if (idx === -1 || idx >= STATUS_SEQUENCE.length - 1) return null;
  return STATUS_SEQUENCE[idx + 1];
}

function isOverdue(order: OrderCardOrder): boolean {
  if (!order.dueDate) return false;
  if (order.status === "Completed") return false;
  return new Date(order.dueDate) < new Date();
}

const chip = "spec px-1.5 py-0.5 text-[10px] tracking-[0.08em]";

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const total = parseFloat(order.totalAmount);
  const balance = total - parseFloat(order.depositAmount);
  const nextStatus = getNextStatus(order.status);
  const overdue = isOverdue(order);
  const web = isWebQuote(order.title);

  return (
    <article
      className={cn(
        "group flex flex-col gap-2.5 border bg-surface-container-lowest p-3.5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5",
        overdue ? "border-brand/60" : "border-outline-variant/40 hover:border-outline-variant",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/dashboard/orders/${order.orderNumber}`}
          className="min-w-0 text-sm font-bold leading-snug hover:text-accent-ink"
        >
          {order.title}
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <span className="spec text-[10px] text-on-surface-variant" title="Order number">
            #{String(order.orderNumber).padStart(4, "0")}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`More actions for order ${order.orderNumber}`}
                className="flex h-7 w-7 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ORDER_STATUSES.filter((s) => s !== order.status).map((status) => (
                <DropdownMenuItem key={status} onClick={() => onStatusChange(order.id, status)}>
                  Move to {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <User className="h-3 w-3" />
        <span className="truncate">{order.customer.name}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {order.items.map((item, i) => (
          <span key={i} className={cn(chip, "border border-outline-variant/50 text-on-surface-variant")}>
            {item.quantity}× {item.productType}
          </span>
        ))}
        {web && <span className={cn(chip, "border border-brand/60 text-accent-ink")}>Web quote</span>}
        {overdue && <span className={cn(chip, "bg-brand text-white")}>Overdue</span>}
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/30 pt-2.5 font-mono text-xs">
        {order.dueDate ? (
          <span className={cn("flex items-center gap-1", overdue ? "text-accent-ink" : "text-on-surface-variant")}>
            {overdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
            {new Date(order.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
          </span>
        ) : (
          <span className="text-on-surface-variant">No due date</span>
        )}
        <span className="tabular-nums">
          {total > 0 ? `₱${total.toLocaleString()}` : "To quote"}
          {balance > 0 && <span className="ml-1.5 text-accent-ink">· ₱{balance.toLocaleString()}</span>}
        </span>
      </div>

      {nextStatus && (
        <button
          type="button"
          onClick={() => onStatusChange(order.id, nextStatus)}
          className="group/adv flex min-h-9 items-center justify-center gap-1.5 border border-outline-variant/50 font-headline text-[11px] font-bold uppercase tracking-[0.1em] transition-colors hover:border-brand hover:bg-brand hover:text-white"
        >
          Move to {nextStatus}
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/adv:translate-x-0.5" />
        </button>
      )}
    </article>
  );
}
