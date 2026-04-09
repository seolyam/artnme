import { getCustomersWithOrderCount } from "@/app/actions/customers";
import { CustomersTable } from "@/components/dashboard/customers-table";

export default async function CustomersPage() {
  const customers = await getCustomersWithOrderCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          All customers from your order history
        </p>
      </div>

      <CustomersTable customers={customers} />
    </div>
  );
}
