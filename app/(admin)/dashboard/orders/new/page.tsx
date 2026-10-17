import { getCustomers } from "@/app/actions/customers";
import { CreateOrderForm } from "@/components/forms/create-order-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const [customers, sp] = await Promise.all([getCustomers(), searchParams]);
  const preselectCustomerId = typeof sp.customer === "string" ? sp.customer : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        back={{ href: "/dashboard/orders", label: "Orders board" }}
        eyebrow="New order"
        title="Take an order"
        description="Four quick steps. Only the customer and one item are required; everything else can be filled in later."
      />

      <CreateOrderForm
        customers={customers.map((c) => ({ id: c.id, name: c.name, contactNumber: c.contactNumber }))}
        preselectCustomerId={preselectCustomerId}
      />
    </div>
  );
}
