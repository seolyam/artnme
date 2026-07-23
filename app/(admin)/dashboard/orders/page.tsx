import Link from "next/link";
import { getOrders } from "@/app/actions/orders";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1 pb-4">
          <h1 className="text-4xl font-bold tracking-tighter uppercase" style={{ fontFamily: "var(--font-headline)" }}>Orders</h1>
          <p className="text-muted-foreground/80 font-medium tracking-wide">
            TRACK AND MANAGE ALL PRINTING ORDERS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/orders/trash" prefetch={true}>
              <Trash2 className="mr-2 h-4 w-4" />
              Trash
            </Link>
          </Button>
          <Button asChild className="rounded-none">
            <Link href="/dashboard/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </Button>
        </div>
      </div>

      <KanbanBoard orders={orders} />
    </div>
  );
}
