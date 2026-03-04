import { getCustomers } from "@/app/actions/customers";
import { CreateOrderForm } from "@/components/forms/create-order-form";

export default async function NewOrderPage() {
  const customers = await getCustomers();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
        <p className="text-muted-foreground">
          Create a new printing order for a customer
        </p>
      </div>

      <CreateOrderForm
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
