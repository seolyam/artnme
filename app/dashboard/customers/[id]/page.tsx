import { getCustomerById } from "@/app/actions/customers";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Edit, Facebook, Phone, Package, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Pending: "secondary",
  Designing: "outline",
  Printing: "default",
  "Ready for Pickup": "default",
  Completed: "secondary",
};

interface CustomerProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerDetailPage({ params }: CustomerProps) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const totalOrders = customer.orders.length;
  const totalRevenue = customer.orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
  const pendingBalance = customer.orders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) - parseFloat(order.depositAmount)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
            <p className="text-muted-foreground">Customer since {format(new Date(customer.createdAt), "MMMM d, yyyy")}</p>
          </div>
        </div>
        {/* We can potentially add an Edit button here later */}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className={customer.contactNumber ? "" : "text-muted-foreground italic"}>
                {customer.contactNumber || "No phone number"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Facebook className="h-4 w-4 text-muted-foreground" />
              {customer.fbMessengerLink ? (
                <a href={customer.fbMessengerLink} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                  {customer.fbMessengerLink}
                </a>
              ) : (
                <span className="text-muted-foreground italic">No messenger link</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lifetime Value */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Customer Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <div className="text-2xl font-bold mt-1">{totalOrders}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lifetime Value</p>
                <div className="text-2xl font-bold mt-1">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Balance</p>
                <div className="text-2xl font-bold mt-1 text-destructive">
                  ₱{pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-8 w-8 mb-3 opacity-20" />
              <p>No orders found for this customer.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customer.orders.map((order) => {
                const balance = parseFloat(order.totalAmount) - parseFloat(order.depositAmount);
                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.title}</span>
                        <Badge variant={STATUS_BADGE_VARIANT[order.status] ?? "outline"}>{order.status}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" />
                          <span>{order.items.length} items</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-medium">₱{parseFloat(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      {balance > 0 && (
                        <div className="text-sm text-destructive">
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
    </div>
  );
}
