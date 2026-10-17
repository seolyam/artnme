import { UserPlus } from "lucide-react";
import { getCustomersWithOrderCount } from "@/app/actions/customers";
import { getMe } from "@/app/actions/staff";
import { CustomersTable } from "@/components/dashboard/customers-table";
import { CustomerDialog } from "@/components/dashboard/customer-dialog";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function CustomersPage() {
  const [customers, me] = await Promise.all([getCustomersWithOrderCount(), getMe()]);

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader
        eyebrow={`Customers · ${customers.length}`}
        title="Customers"
        description="Everyone who has ordered. Open a customer to see their orders, what they still owe, and notes."
        actions={
          <CustomerDialog
            others={customers.map((c) => ({ id: c.id, name: c.name, contactNumber: c.contactNumber }))}
            trigger={
              <button
                type="button"
                className="inline-flex min-h-12 items-center gap-2 border border-outline-variant/60 px-4 text-sm font-semibold transition-colors hover:border-on-surface-variant"
              >
                <UserPlus className="h-4 w-4" />
                Add customer
              </button>
            }
          />
        }
      />

      <CustomersTable customers={customers} isAdmin={me.role === "admin"} />
    </div>
  );
}
