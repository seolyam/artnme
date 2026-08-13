"use client";

import { useState, useTransition, useEffect } from "react";
import { ORDER_STATUSES, PRODUCT_TYPES, type OrderStatus } from "@/db/schema";
import { updateOrderStatus } from "@/app/actions/orders";
import { OrderCard } from "@/components/dashboard/order-card";
import { Badge } from "@/components/ui/badge";
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

interface OrderWithRelations {
  id: string;
  orderNumber: number;
  title: string;
  status: string;
  totalAmount: string;
  depositAmount: string;
  dueDate: Date | null;
  createdAt: Date;
  customer: { id: string; name: string };
  items: { id: string; productType: string; quantity: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500",
  Designing: "bg-blue-500",
  Printing: "bg-purple-500",
  "Ready for Pickup": "bg-emerald-500",
  Completed: "bg-gray-400",
};

export function KanbanBoard({ orders }: { orders: OrderWithRelations[] }) {
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
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
    const previousStatus =
      localOrders.find((o) => o.id === orderId)?.status ?? newStatus;

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

  const filteredOrders = localOrders.filter((order) => {
    const matchesSearch =
      search === "" ||
      order.title.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(search.toLowerCase());

    const matchesProduct =
      productFilter === "all" ||
      order.items.some((item) => item.productType === productFilter);

    return matchesSearch && matchesProduct;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders or customers..."
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

      {/* Board */}
      <div className="grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-4">
        {ORDER_STATUSES.map((status) => {
          const statusOrders = filteredOrders.filter(
            (o) => o.status === status,
          );
          return (
            <div key={status} className="min-w-[240px]">
              {/* Column header */}
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]}`}
                />
                <h3 className="text-sm font-semibold">{status}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {statusOrders.length}
                </Badge>
              </div>

              {/* Column body */}
              <div className="space-y-2 bg-[color:var(--color-surface-container-low)] p-2 min-h-[120px]">
                {statusOrders.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No active jobs
                  </p>
                ) : (
                  statusOrders.map((order) => (
                    <div key={order.id} className="relative">
                      {pendingId === order.id && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      <OrderCard
                        order={order}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}