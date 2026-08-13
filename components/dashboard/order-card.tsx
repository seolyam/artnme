"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Calendar, User, ChevronRight, AlertTriangle } from "lucide-react";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";

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

function OrderBadge({ orderNumber }: { orderNumber: number }) {
  return (
    <span
      className="text-[10px] font-bold tabular-nums text-muted-foreground bg-muted/60 px-1.5 py-0.5 align-top"
      title="Order number"
    >
      #{orderNumber}
    </span>
  );
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

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const balance =
    parseFloat(order.totalAmount) - parseFloat(order.depositAmount);
  const nextStatus = getNextStatus(order.status);
  const overdue = isOverdue(order);

  return (
    <Card className={`shadow-sm transition-shadow hover:shadow-md ${overdue ? "border-destructive/60 bg-destructive/5" : ""}`}>
      <CardHeader className="p-3 pb-1">
        <div className="flex items-start justify-between gap-1">
          <Link
            href={`/dashboard/orders/${order.orderNumber}`}
            className="text-sm font-medium leading-tight truncate hover:underline"
          >
            {order.title}
          </Link>
          <OrderBadge orderNumber={order.orderNumber} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 shrink-0 p-0"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ORDER_STATUSES.filter((s) => s !== order.status).map(
                (status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => onStatusChange(order.id, status)}
                  >
                    Move to {status}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{order.customer.name}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {order.items.map((item, i) => (
            <Badge key={i} variant="outline" className="text-[10px] px-1.5">
              {item.quantity}x {item.productType}
            </Badge>
          ))}
        </div>

        {order.dueDate && (
          <div className={`flex items-center gap-1 text-xs ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {overdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
            {new Date(order.dueDate).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {overdue && (
              <Badge variant="destructive" className="text-[10px] ml-1">
                Overdue
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-xs text-muted-foreground">
            {"\u20B1"}
            {parseFloat(order.totalAmount).toLocaleString()}
          </span>
          {balance > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              Bal: {"\u20B1"}
              {balance.toLocaleString()}
            </Badge>
          )}
        </div>

        {nextStatus && (
          <Button
            size="sm"
            variant="default"
            className="w-full"
            onClick={() => onStatusChange(order.id, nextStatus)}
          >
            Advance to {nextStatus}
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
