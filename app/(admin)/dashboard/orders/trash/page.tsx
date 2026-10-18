import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTrashedOrders } from "@/app/actions/orders";
import { getMe } from "@/app/actions/staff";
import { TrashTable } from "@/components/dashboard/trash-table";
import { TRASH_RETENTION_DAYS } from "@/lib/order-status";

export default async function TrashPage() {
  const me = await getMe();
  // The sidebar hides Trash from staff; anyone landing here by URL goes back.
  if (me.role !== "admin") redirect("/dashboard/orders");

  const orders = await getTrashedOrders();

  return (
    <div className="max-w-5xl space-y-6">
      <header className="space-y-4">
        <Link
          href="/dashboard/orders"
          className="spec inline-flex items-center gap-1.5 text-[11px] text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Orders board
        </Link>
        <div>
          <p className="spec mb-2 text-[11px] text-on-surface-variant">Admin only</p>
          <h1 className="font-headline text-4xl font-bold uppercase leading-none tracking-[-0.045em] md:text-5xl">
            Trash
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            Deleted orders stay here for {TRASH_RETENTION_DAYS} days so you can restore them. After that they are
            removed for good automatically.
          </p>
        </div>
      </header>

      <TrashTable orders={orders} />
    </div>
  );
}
