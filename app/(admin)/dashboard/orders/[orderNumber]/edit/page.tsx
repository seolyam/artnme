import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/app/actions/orders";
import { EditOrderForm } from "@/components/forms/edit-order-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await getOrder(orderNumber);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
          <Link href={`/dashboard/orders/${order.orderNumber}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Order</h1>
          <p className="text-sm text-muted-foreground">{order.title}</p>
        </div>
      </div>

      <EditOrderForm order={order} />
    </div>
  );
}
