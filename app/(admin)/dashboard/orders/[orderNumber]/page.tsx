import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getOrderActorProfile } from "@/app/actions/orders";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  User,
  Package,
  Banknote,
  History,
  PenLine,
} from "lucide-react";
import { OrderActions } from "@/components/dashboard/order-actions";
import { RecordDepositDialog } from "@/components/dashboard/record-deposit-dialog";

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500",
  Designing: "bg-blue-500",
  Printing: "bg-purple-500",
  "Ready for Pickup": "bg-emerald-500",
  Completed: "bg-gray-400",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await getOrder(orderNumber);

  if (!order) {
    notFound();
  }

  const balance =
    parseFloat(order.totalAmount) - parseFloat(order.depositAmount);
  const isOverdue =
    order.dueDate &&
    new Date(order.dueDate) < new Date() &&
    order.status !== "Completed";

  const [createdByProfile, updatedByProfile] = await Promise.all([
    getOrderActorProfile(order.createdBy ?? null),
    getOrderActorProfile(order.updatedBy ?? null),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
              <Link href="/dashboard/orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span
              className="font-mono text-xs tabular-nums text-muted-foreground bg-surface-container-high px-2 py-1 hidden sm:inline-block"
              style={{ fontFamily: "var(--font-label)" }}
              title={`Order #${order.orderNumber} · ${order.id}`}
            >
              #{order.orderNumber}
            </span>
            <h1 className="text-2xl font-bold tracking-tight">
              {order.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${STATUS_COLORS[order.status] || ""}`}
            />
            <span className="text-sm text-muted-foreground">
              {order.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RecordDepositDialog
            orderId={order.id}
            currentDeposit={order.depositAmount}
            totalAmount={order.totalAmount}
            orderTitle={order.title}
          />
          <OrderActions
            orderId={order.id}
            orderNumber={order.orderNumber}
            currentStatus={order.status}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer & Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Customer:</span>
              <Link
                href={`/dashboard/customers/${order.customer.id}`}
                prefetch={true}
                className="font-medium hover:underline"
              >
                {order.customer.name}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>
                {new Date(order.createdAt).toLocaleDateString("en-PH", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {order.dueDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                  {new Date(order.dueDate).toLocaleDateString("en-PH", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {isOverdue && " (Overdue)"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4" />
              Financials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">
                {"\u20B1"}
                {parseFloat(order.totalAmount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Deposit</span>
              <span>
                {"\u20B1"}
                {parseFloat(order.depositAmount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="font-medium">Balance</span>
              <span
                className={`font-bold ${balance > 0 ? "text-destructive" : "text-emerald-600"}`}
              >
                {"\u20B1"}
                {balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Items ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {order.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items.</p>
          ) : (
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between rounded-md border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.productType}</Badge>
                      <span className="text-sm text-muted-foreground">
                        x{item.quantity}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    {item.dimensions && (
                      <p className="text-xs text-muted-foreground">
                        Dimensions: {item.dimensions}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {"\u20B1"}
                    {parseFloat(item.unitPrice).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created by:</span>
            <span className="font-medium">
              {createdByProfile?.fullName ?? "Unknown staff"}
            </span>
            <span className="text-xs text-muted-foreground">
              ·{" "}
              {new Date(order.createdAt).toLocaleDateString("en-PH", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          {order.updatedAt && (
            <div className="flex items-center gap-2 text-sm">
              <PenLine className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last updated:</span>
              <span className="font-medium">
                {updatedByProfile?.fullName ?? "Unknown staff"}
              </span>
              <span className="text-xs text-muted-foreground">
                ·{" "}
                {new Date(order.updatedAt).toLocaleDateString("en-PH", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          {!order.updatedAt && (
            <p className="text-xs text-muted-foreground">
              No edits recorded since creation.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
