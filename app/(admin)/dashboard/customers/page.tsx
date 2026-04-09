import { getCustomersWithOrderCount } from "@/app/actions/customers";
import { CustomersTable } from "@/components/dashboard/customers-table";

export default async function CustomersPage() {
  const customers = await getCustomersWithOrderCount();

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-1 pb-4">
        <h1 className="text-4xl font-bold tracking-tighter uppercase" style={{ fontFamily: "var(--font-headline)" }}>Client Directory</h1>
        <p className="text-muted-foreground/80 font-medium tracking-wide">
          ALL CUSTOMERS FROM YOUR ORDER HISTORY
        </p>
      </div>

      <CustomersTable customers={customers} />
    </div>
  );
}
