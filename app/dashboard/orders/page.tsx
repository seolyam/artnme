import Link from "next/link";
import { getOrders } from "@/app/actions/orders";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Track and manage all printing orders
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </div>

      <KanbanBoard orders={orders} />
    </div>
  );
}
