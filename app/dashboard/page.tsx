import { getOrderStats, getRecentOrders } from "@/app/actions/orders";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Banknote,
  PackageCheck,
  CalendarClock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Pending: "secondary",
  Designing: "outline",
  Printing: "default",
  "Ready for Pickup": "default",
  Completed: "secondary",
};

export default async function DashboardPage() {
  const [stats, recentOrders] = await Promise.all([
    getOrderStats(),
    getRecentOrders(7),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your printing orders
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Active Orders"
          value={stats.activeOrders}
          icon={ClipboardList}
        />
        <StatCard
          title="Due Today"
          value={stats.dueToday}
          icon={CalendarClock}
          highlight={stats.dueToday > 0}
        />
        <StatCard
          title="Overdue"
          value={stats.overdueOrders}
          icon={AlertTriangle}
          variant={stats.overdueOrders > 0 ? "destructive" : "default"}
        />
        <StatCard
          title="Revenue Pending"
          description="Total - Deposits"
          value={`\u20B1${stats.pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Banknote}
        />
        <StatCard
          title="Ready for Pickup"
          value={stats.readyForPickup}
          icon={PackageCheck}
          highlight={stats.readyForPickup > 0}
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
          <Link
            href="/dashboard/orders"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No orders yet. Create your first order to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const balance =
                  parseFloat(order.totalAmount) -
                  parseFloat(order.depositAmount);
                const isOverdue =
                  order.dueDate &&
                  new Date(order.dueDate) < new Date() &&
                  order.status !== "Completed";

                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                      isOverdue ? "border-destructive/40" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {order.title}
                        </span>
                        <Badge
                          variant={
                            STATUS_BADGE_VARIANT[order.status] ?? "outline"
                          }
                          className="text-[10px] shrink-0"
                        >
                          {order.status}
                        </Badge>
                        {isOverdue && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] shrink-0"
                          >
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{order.customer.name}</span>
                        {order.dueDate && (
                          <span>
                            Due{" "}
                            {new Date(order.dueDate).toLocaleDateString(
                              "en-PH",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        )}
                        <span>
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-sm font-medium">
                        {"\u20B1"}
                        {parseFloat(order.totalAmount).toLocaleString()}
                      </div>
                      {balance > 0 && (
                        <div className="text-xs text-destructive">
                          Bal: {"\u20B1"}
                          {balance.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  description,
  value,
  icon: Icon,
  highlight = false,
  variant = "default",
}: {
  title: string;
  description?: string;
  value: string | number;
  icon: LucideIcon;
  highlight?: boolean;
  variant?: "default" | "destructive";
}) {
  const isDestructive = variant === "destructive";
  return (
    <Card className={isDestructive ? "border-destructive/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle
            className={`text-sm font-medium ${isDestructive ? "text-destructive" : "text-muted-foreground"}`}
          >
            {title}
          </CardTitle>
          {description && (
            <p className="text-xs text-muted-foreground/70">{description}</p>
          )}
        </div>
        <Icon
          className={`h-4 w-4 ${isDestructive ? "text-destructive" : "text-muted-foreground"}`}
        />
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${isDestructive ? "text-destructive" : highlight ? "text-primary" : ""}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
