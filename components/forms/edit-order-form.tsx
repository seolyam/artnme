"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { orderFormSchema, type OrderFormSchemaValues } from "@/lib/validators";
import type { OrderFormValues } from "@/lib/validators";
import { updateOrder } from "@/app/actions/orders";
import { PRODUCT_TYPES } from "@/db/schema";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface OrderData {
  id: string;
  orderNumber: number;
  title: string;
  status: string;
  totalAmount: string;
  depositAmount: string;
  dueDate: Date | null;
  customerId: string;
  customer: { id: string; name: string };
  items: {
    id: string;
    productType: string;
    description: string | null;
    quantity: number;
    dimensions: string | null;
    unitPrice: string;
  }[];
}

interface EditOrderFormProps {
  order: OrderData;
}

export function EditOrderForm({ order }: EditOrderFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OrderFormSchemaValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4.3 minor version struct mismatch with @hookform/resolvers types
    resolver: zodResolver(orderFormSchema as any),
    defaultValues: {
      customerId: order.customerId,
      title: order.title,
      status: order.status as OrderFormSchemaValues["status"],
      totalAmount: parseFloat(order.totalAmount),
      depositAmount: parseFloat(order.depositAmount),
      dueDate: order.dueDate
        ? new Date(order.dueDate).toISOString().slice(0, 16)
        : "",
      items: order.items.map((item) => ({
        id: item.id,
        productType: item.productType as OrderFormSchemaValues["items"][number]["productType"],
        description: item.description || "",
        quantity: item.quantity,
        dimensions: item.dimensions || "",
        unitPrice: parseFloat(item.unitPrice),
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Auto-calculate total from items
  const watchedItems = form.watch("items");
  useEffect(() => {
    const total = watchedItems.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0,
    );
    form.setValue("totalAmount", total);
  }, [watchedItems, form]);

  async function onSubmit(values: OrderFormSchemaValues) {
    setSubmitting(true);
    try {
      const orderData: OrderFormValues = {
        ...values,
        customerId: order.customerId,
      };

      const result = await updateOrder(order.id, orderData);

      if (result.error) {
        if (result.fieldErrors && Array.isArray(result.fieldErrors)) {
          for (const fe of result.fieldErrors) {
            if (!fe.path) {
              toast.error(fe.message);
              continue;
            }
            const segments = fe.path.split(".");
            form.setError(segments.join(".") as never, {
              message: fe.message,
            });
          }
          if (result.fieldErrors.length === 0) {
            toast.error(result.error);
          } else {
            toast.error(result.error, {
              description: "Please fix the highlighted fields.",
            });
          }
        } else {
          toast.error(result.error);
        }
      } else {
        toast.success("Order updated successfully!");
        router.push(`/dashboard/orders/${order.orderNumber}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium">{order.customer.name}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. "Birthday Tarpaulin Set"'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Designing">Designing</SelectItem>
                        <SelectItem value="Printing">Printing</SelectItem>
                        <SelectItem value="Ready for Pickup">
                          Ready for Pickup
                        </SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Items{" "}
                <Badge variant="secondary" className="ml-2">
                  {fields.length}
                </Badge>
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    productType: "Tarpaulin",
                    description: "",
                    quantity: 1,
                    dimensions: "",
                    unitPrice: 0,
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border bg-muted/20 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Item {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRODUCT_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qty</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.dimensions`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensions</FormLabel>
                        <FormControl>
                          <Input placeholder="3ft x 5ft" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description / Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Design details, special instructions..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
            {form.formState.errors.items?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.items.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount (auto-calculated)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="depositAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit Amount</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Balance remaining</span>
              <span className="text-lg font-bold">
                {"\u20B1"}
                {Math.max(
                  0,
                  (Number(form.watch("totalAmount")) || 0) -
                    (Number(form.watch("depositAmount")) || 0),
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Order
          </Button>
        </div>
      </form>
    </Form>
  );
}
