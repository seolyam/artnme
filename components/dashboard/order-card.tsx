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
import { initials, isWebQuote, nextStatus } from "@/lib/order-status";
import { balanceOf, peso, toNumber } from "@/lib/money";
import { formatShopDate } from "@/lib/time";
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
  assigneeName?: string | null;
  isMine?: boolean;
}

function isOverdue(order: OrderCardOrder): boolean {
  if (!order.dueDate) return false;
  if (order.status === "Completed") return false;
  return new Date(order.dueDate) < new Date();
}

const chip = "spec px-1.5 py-0.5 text-[10px] tracking-[0.08em]";

export function OrderCard({ order, onStatusChange, assigneeName = null, isMine = false }: OrderCardProps) {
  const total = toNumber(order.totalAmount);
  const balance = balanceOf(order);
  const next = nextStatus(order.status);
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
                className="flex h-9 w-9 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild className="min-h-9 rounded-none">
                <Link href={`/dashboard/orders/${order.orderNumber}`}>Open order</Link>
              </DropdownMenuItem>
              {ORDER_STATUSES.filter((s) => s !== order.status).map((status) => (
                <DropdownMenuItem key={status} className="min-h-9 rounded-none" onClick={() => onStatusChange(order.id, status)}>
                  Move to {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <User className="h-3 w-3" />
        <span className="min-w-0 flex-1 truncate">{order.customer.name}</span>
        <span
          title={assigneeName ? `Assigned to ${assigneeName}${isMine ? " (you)" : ""}` : "Unassigned"}
          className={cn(
            "flex h-5 min-w-5 shrink-0 items-center justify-center px-1 font-headline text-[9px] font-bold",
            isMine
              ? "bg-brand text-white"
              : assigneeName
                ? "bg-on-surface/80 text-surface"
                : "border border-dashed border-outline-variant text-on-surface-variant",
          )}
        >
          {assigneeName ? initials(assigneeName) : "—"}
        </span>
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
            {formatShopDate(order.dueDate)}
          </span>
        ) : (
          <span className="text-on-surface-variant">No due date</span>
        )}
        <span className="tabular-nums">
          {total > 0 ? peso(total, false) : "To quote"}
          {balance > 0.009 && (
            <span className="ml-1.5 text-accent-ink" title="Still to collect">
              · {peso(balance, false)} due
            </span>
          )}
        </span>
      </div>

      {next && (
        <button
          type="button"
          onClick={() => onStatusChange(order.id, next)}
          className="group/adv flex min-h-10 items-center justify-center gap-1.5 border border-outline-variant/50 font-headline text-[11px] font-bold uppercase tracking-[0.1em] transition-colors hover:border-brand hover:bg-brand hover:text-white"
        >
          Move to {next}
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/adv:translate-x-0.5" />
        </button>
      )}
    </article>
  );
}
