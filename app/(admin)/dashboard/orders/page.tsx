import Link from "next/link";
import { Suspense } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getOrders } from "@/app/actions/orders";
import { getMe, getStaff } from "@/app/actions/staff";
import { BOARD_ARCHIVE_DAYS } from "@/lib/order-status";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { PageHeader, PrimaryLink } from "@/components/dashboard/page-header";

export default async function OrdersPage() {
  const [orders, staff, me] = await Promise.all([getOrders(), getStaff(), getMe()]);
  const active = orders.filter((o) => o.status !== "Completed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Board · ${active} active job${active === 1 ? "" : "s"}`}
        title="Orders"
        description="Every job from first quote to pickup. Press “Move to …” on a card when the work moves on."
        actions={
          <>
            {me.role === "admin" && (
              <Link
                href="/dashboard/orders/trash"
                className="inline-flex min-h-12 items-center gap-2 border border-outline-variant/60 px-4 text-sm font-semibold text-on-surface-variant transition-colors hover:border-on-surface-variant hover:text-on-surface"
              >
                <Trash2 className="h-4 w-4" />
                Trash
              </Link>
            )}
            <PrimaryLink href="/dashboard/orders/new">
              <Plus className="h-4 w-4" />
              New order
            </PrimaryLink>
          </>
        }
      />

      <Suspense>
        <KanbanBoard orders={orders} staff={staff} meId={me.id} archiveDays={BOARD_ARCHIVE_DAYS} />
      </Suspense>
    </div>
  );
}
