import Link from "next/link";
import { getTrashedOrders } from "@/app/actions/orders";
import { TrashTable } from "@/components/dashboard/trash-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";

export default async function TrashPage() {
  let orders: Awaited<ReturnType<typeof getTrashedOrders>> = [];
  let authError: string | null = null;

  try {
    orders = await getTrashedOrders();
  } catch (e) {
    authError =
      e instanceof Error ? e.message : "Unable to load trash. Admin access required.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1
              className="text-3xl font-bold tracking-tighter uppercase leading-none flex items-center gap-2"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              <Trash2 className="h-6 w-6" />
              Trash
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Deleted orders · Admin only · Restore or permanently remove
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>

      {authError ? (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-sm text-destructive">
          {authError}
        </div>
      ) : (
        <TrashTable orders={orders} />
      )}
    </div>
  );
}
