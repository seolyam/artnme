"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { z } from "zod/v4";

import { orderFormSchema, type OrderFormSchemaValues } from "@/lib/validators";
import { updateOrder } from "@/app/actions/orders";
import { ORDER_STATUSES } from "@/db/schema";
import { toShopInputValue } from "@/lib/time";
import { peso, roundMoney, toNumber } from "@/lib/money";
import { statusStyle } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { CustomerOption } from "@/components/forms/customer-combobox";
import { useCustomerPicker } from "@/components/forms/customer-picker";
import {
  BalanceLine,
  DueDateField,
  FormSection,
  ItemsEditor,
  TotalField,
  applyFieldErrors,
  fieldClass,
  suggestTitle,
} from "@/components/forms/order-form-parts";

const editFormSchema = orderFormSchema.extend({ title: z.string().trim().max(200) });

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
  customers: CustomerOption[];
  renderItemExtras?: (index: number) => React.ReactNode;
}

export function EditOrderForm({ order, customers, renderItemExtras }: EditOrderFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [correctingPaid, setCorrectingPaid] = useState(false);
  const picker = useCustomerPicker({ customers, initialId: order.customerId });

  const itemsTotalAtLoad = roundMoney(
    order.items.reduce((sum, it) => sum + it.quantity * toNumber(it.unitPrice), 0),
  );
  const paidAtLoad = toNumber(order.depositAmount);

  const form = useForm<OrderFormSchemaValues>({
    resolver: zodResolver(editFormSchema as never),
    defaultValues: {
      customerId: order.customerId,
      title: order.title,
      status: order.status as OrderFormSchemaValues["status"],
      totalAmount: toNumber(order.totalAmount),
      depositAmount: paidAtLoad,
      // toISOString() would show UTC and shift the due date 8h on every save.
      dueDate: toShopInputValue(order.dueDate),
      items: order.items.map((item) => ({
        id: item.id,
        productType: item.productType as OrderFormSchemaValues["items"][number]["productType"],
        description: item.description || "",
        quantity: item.quantity,
        dimensions: item.dimensions || "",
        unitPrice: toNumber(item.unitPrice),
      })),
    },
  });

  const items = useWatch({ control: form.control, name: "items" });
  const total = Number(useWatch({ control: form.control, name: "totalAmount" })) || 0;
  const paid = Number(useWatch({ control: form.control, name: "depositAmount" })) || 0;

  async function onSubmit(values: OrderFormSchemaValues) {
    setSubmitting(true);
    try {
      const customerId = await picker.resolve();
      if (!customerId) return;

      const result = await updateOrder(order.id, {
        ...values,
        customerId,
        title: values.title.trim() || suggestTitle(items) || order.title,
      });

      if (result.error) {
        applyFieldErrors(form.setError as never, result.fieldErrors);
        toast.error(result.error, result.fieldErrors?.length ? { description: "Fix the fields marked in red." } : undefined);
        return;
      }
      toast.success(`Order #${order.orderNumber} saved`);
      router.push(`/dashboard/orders/${order.orderNumber}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
        <FormSection title="Customer">{picker.section}</FormSection>

        <FormSection title="Items">
          <div className="space-y-4">
            <ItemsEditor renderExtras={renderItemExtras} />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order name</FormLabel>
                  <FormControl>
                    <Input className={fieldClass} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection title="Due date & status">
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => <DueDateField value={field.value} onChange={field.onChange} />}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Status">
                    {ORDER_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={field.value === s}
                        onClick={() => field.onChange(s)}
                        className={cn(
                          "inline-flex min-h-10 items-center gap-2 border px-3.5 text-sm font-semibold transition-colors",
                          field.value === s
                            ? "border-on-surface bg-on-surface text-surface"
                            : "border-outline-variant/60 hover:border-on-surface-variant",
                        )}
                      >
                        <span className={cn("h-2 w-2", statusStyle(s).dot)} />
                        {s}
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection title="Money">
          <div className="grid gap-4 sm:grid-cols-2">
            <TotalField startManual={Math.abs(itemsTotalAtLoad - toNumber(order.totalAmount)) > 0.009} />

            <div className="space-y-2">
              <p className="text-sm font-medium">Amount paid so far</p>
              {correctingPaid ? (
                <FormField
                  control={form.control}
                  name="depositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          aria-label="Amount paid so far"
                          className={cn(fieldClass, "font-mono")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className="flex h-11 items-center border border-outline-variant/40 bg-surface-container px-3 font-mono font-semibold">
                  {peso(paidAtLoad)}
                </p>
              )}
              {correctingPaid ? (
                <p className="flex gap-2 text-xs text-amber-700 dark:text-[#f2b33d]">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Only fix mistakes here. The change is saved in the payment log as an adjustment. Money the
                  customer just handed over goes through “Record payment” on the order page.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setCorrectingPaid(true)}
                  className="text-xs text-on-surface-variant underline-offset-2 hover:text-on-surface hover:underline"
                >
                  Correct a mistake in the amount paid
                </button>
              )}
            </div>
          </div>
          <BalanceLine total={total} paid={paid} paidLabel="Paid" />
        </FormSection>

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-outline-variant/40 bg-background/95 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => router.back()}
            className="min-h-12 px-4 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="ink-fill inline-flex min-h-12 items-center gap-2 bg-brand px-6 font-headline text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </Form>
  );
}
