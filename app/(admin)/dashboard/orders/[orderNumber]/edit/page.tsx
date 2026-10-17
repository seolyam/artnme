import { notFound } from "next/navigation";
import { getOrder } from "@/app/actions/orders";
import { getCustomers } from "@/app/actions/customers";
import { getPricePresets } from "@/app/actions/prices";
import { EditOrderForm } from "@/components/forms/edit-order-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const [order, customers, presets] = await Promise.all([getOrder(orderNumber), getCustomers(), getPricePresets()]);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        back={{ href: `/dashboard/orders/${order.orderNumber}`, label: `Order #${String(order.orderNumber).padStart(4, "0")}` }}
        eyebrow={`Editing #${String(order.orderNumber).padStart(4, "0")}`}
        title="Edit order"
        description={order.title}
      />

      <EditOrderForm
        order={order}
        customers={customers.map((c) => ({ id: c.id, name: c.name, contactNumber: c.contactNumber }))}
        presets={presets}
      />
    </div>
  );
}
