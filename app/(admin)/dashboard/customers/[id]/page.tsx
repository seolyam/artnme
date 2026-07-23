import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/app/actions/customers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Calendar,
  ShoppingCart,
  Banknote,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  Designing: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  Printing: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  "Ready for Pickup": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  Completed: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const allOrders = customer.orders;
  const totalSpent = allOrders.reduce(
    (sum, o) => sum + parseFloat(o.totalAmount),
    0,
  );
  const totalDeposited = allOrders.reduce(
    (sum, o) => sum + parseFloat(o.depositAmount),
    0,
  );
  const outstandingBalance = allOrders.reduce(
    (sum, o) =>
      sum +
      (parseFloat(o.totalAmount) - parseFloat(o.depositAmount)),
    0,
  );
  const activeOrders = allOrders.filter((o) => o.status !== "Completed");
  const completedOrders = allOrders.filter((o) => o.status === "Completed");
  const overdueOrders = allOrders.filter(
    (o) =>
      o.dueDate &&
      new Date(o.dueDate) < new Date() &&
      o.status !== "Completed",
  );
  const itemCount = allOrders.reduce(
    (sum, o) => sum + o.items.length,
    0,
  );

  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 mt-1">
            <Link href="/dashboard/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container/15 dark:bg-primary/15 text-primary-container dark:text-primary text-lg font-bold">
              {initials || "?"}
            </div>
            <div className="space-y-1">
              <h1
                className="text-3xl font-bold tracking-tighter uppercase leading-none"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {customer.name}
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Client since{" "}
                {new Date(customer.createdAt).toLocaleDateString("en-PH", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <Button asChild>
          <Link
            href={`/dashboard/orders/new?customer=${customer.id}`}
            prefetch={true}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Order for {customer.name.split(" ")[0]}
          </Link>
        </Button>
      </div>

      {/* Contact Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        {customer.contactNumber && (
          <a
            href={`tel:${customer.contactNumber.replace(/\s+/g, "")}`}
            className="group flex items-center gap-3 p-4 bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Call Customer
              </p>
              <p className="text-sm font-medium truncate">
                {customer.contactNumber}
              </p>
            </div>
          </a>
        )}
        {customer.fbMessengerLink && (
          <a
            href={customer.fbMessengerLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-4 bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Message on Facebook
              </p>
              <p className="text-sm font-medium truncate">Open Messenger</p>
            </div>
          </a>
        )}
        {!customer.contactNumber && !customer.fbMessengerLink && (
          <div className="sm:col-span-2 p-4 bg-surface-container-low text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            No contact info on file. Edit this customer to add a phone number or Messenger link.
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total Orders"
          value={allOrders.length}
          icon={ShoppingCart}
        />
        <StatTile
          label="Active Jobs"
          value={activeOrders.length}
          icon={Clock}
          highlight={activeOrders.length > 0}
        />
        <StatTile
          label="Total Spent"
          value={`₱${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
        />
        <StatTile
          label="Outstanding"
          value={`₱${outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Banknote}
          variant={outstandingBalance > 0 ? "destructive" : "default"}
        />
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Order History
              <Badge variant="secondary" className="ml-1">
                {allOrders.length}
              </Badge>
            </CardTitle>
            {allOrders.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {itemCount} item{itemCount !== 1 ? "s" : ""} ·{" "}
                {completedOrders.length} completed
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {allOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No orders yet for this customer.
              </p>
              <Button asChild size="sm">
                <Link href={`/dashboard/orders/new?customer=${customer.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Order
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col">
              {allOrders.map((order, idx) => {
                const balance =
                  parseFloat(order.totalAmount) - parseFloat(order.depositAmount);
                const isOverdue =
                  order.dueDate &&
                  new Date(order.dueDate) < new Date() &&
                  order.status !== "Completed";

                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.orderNumber}`}
                    prefetch={true}
                    className={`group relative flex items-center justify-between px-4 py-4 transition-all duration-150 hover:bg-surface-container ${
                      idx !== allOrders.length - 1
                        ? "border-b border-surface-container-high"
                        : ""
                    } ${isOverdue ? "bg-surface-container-low" : ""}`}
                  >
                    {isOverdue && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary-container dark:bg-primary" />
                    )}

                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className="text-[10px] font-bold tabular-nums text-muted-foreground bg-muted/60 px-1.5 py-0.5 shrink-0"
                          style={{ fontFamily: "var(--font-label)" }}
                          title={`Order #${order.orderNumber}`}
                        >
                          #{order.orderNumber}
                        </span>
                        <span className="text-sm font-semibold truncate">
                          {order.title}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground border-border"}`}
                        >
                          {order.status}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Overdue
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {new Date(order.createdAt).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {order.dueDate && (
                          <span>
                            Due{" "}
                            {new Date(order.dueDate).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        <span>
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-4">
                      <div className="text-sm font-bold tabular-nums">
                        ₱{parseFloat(order.totalAmount).toLocaleString()}
                      </div>
                      {balance > 0 && (
                        <div className="text-xs text-destructive font-medium tabular-nums">
                          Bal: ₱{balance.toLocaleString()}
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

      {/* Lifetime Summary */}
      {allOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lifetime Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Order Value</span>
              <span className="font-medium tabular-nums">
                ₱{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Deposits Received</span>
              <span className="font-medium tabular-nums">
                ₱{totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="font-medium">Outstanding Balance</span>
              <span
                className={`font-bold tabular-nums ${
                  outstandingBalance > 0 ? "text-destructive" : "text-emerald-600"
                }`}
              >
                ₱{outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {overdueOrders.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-3 mt-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                {overdueOrders.length} order{overdueOrders.length !== 1 ? "s" : ""} overdue
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  highlight = false,
  variant = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  highlight?: boolean;
  variant?: "default" | "destructive";
}) {
  const isDestructive = variant === "destructive";

  return (
    <div
      className={`relative flex flex-col gap-2 p-4 bg-surface-container-low ${
        isDestructive ? "ring-1 ring-destructive/20" : ""
      }`}
    >
      {isDestructive && (
        <span className="absolute top-0 left-0 right-0 h-[2px] bg-destructive" />
      )}
      <div className="flex items-center justify-between">
        <p
          className={`text-[10px] uppercase tracking-wider font-semibold ${
            isDestructive ? "text-destructive" : "text-muted-foreground"
          }`}
          style={{ fontFamily: "var(--font-label)" }}
        >
          {label}
        </p>
        <Icon
          className={`h-3.5 w-3.5 ${
            isDestructive
              ? "text-destructive"
              : highlight
                ? "text-primary-container dark:text-primary"
                : "text-muted-foreground/50"
          }`}
          strokeWidth={2}
        />
      </div>
      <div
        className={`text-xl md:text-2xl font-bold tracking-tight leading-none tabular-nums ${
          isDestructive
            ? "text-destructive"
            : highlight
              ? "text-primary-container dark:text-primary"
              : "text-foreground"
        }`}
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {value}
      </div>
    </div>
  );
}
