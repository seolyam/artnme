"use client";

import { useState, useTransition, useEffect } from "react";
import { ORDER_STATUSES, PRODUCT_TYPES, type OrderStatus } from "@/db/schema";
import { updateOrderStatus } from "@/app/actions/orders";
import { OrderCard } from "@/components/dashboard/order-card";
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
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { statusStyle } from "@/lib/order-status";
import { cn } from "@/lib/utils";

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

      {/* Board — cards share a layoutId, so a status change glides across columns */}
      <LayoutGroup>
        <div className="grid auto-cols-[minmax(250px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4">
          {ORDER_STATUSES.map((status, colIdx) => {
            const statusOrders = filteredOrders.filter((o) => o.status === status);
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
                        {pendingId === order.id && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
                            <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />
                          </div>
                        )}
                        <OrderCard order={order} onStatusChange={handleStatusChange} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {statusOrders.length === 0 && (
                    <p className="spec border border-dashed border-outline-variant/50 px-2 py-8 text-center text-[10px] text-on-surface-variant">
                      No jobs here
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