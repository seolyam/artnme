"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod/v4";

import { orderFormSchema, type OrderFormSchemaValues } from "@/lib/validators";
import { createOrder } from "@/app/actions/orders";
import { ORDER_STATUSES } from "@/db/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PaymentMethodPicker } from "@/components/dashboard/payment-method-picker";
import type { CustomerOption } from "@/components/forms/customer-combobox";
import { useCustomerPicker } from "@/components/forms/customer-picker";
import { ItemPricingTools } from "@/components/forms/item-pricing-tools";
import type { PricePresetView } from "@/app/actions/prices";
import {
  BalanceLine,
  DueDateField,
  EMPTY_ITEM,
  FormSection,
  ItemsEditor,
  TotalField,
  applyFieldErrors,
  fieldClass,
  suggestTitle,
} from "@/components/forms/order-form-parts";
import { peso, roundMoney } from "@/lib/money";
import { statusStyle } from "@/lib/order-status";
import { cn } from "@/lib/utils";

// The title may be left blank here; it's filled from the items on submit.
const createFormSchema = orderFormSchema.extend({ title: z.string().trim().max(200) });

export type CreateOrderDefaults = Partial<Pick<OrderFormSchemaValues, "title" | "items" | "dueDate">>;

interface CreateOrderFormProps {
  customers: CustomerOption[];
  preselectCustomerId?: string;
  /** Prefill from an earlier order ("Order again"). */
  defaults?: CreateOrderDefaults;
  /** Shown above the form when prefilled, e.g. "Copied from #0012". */
  notice?: React.ReactNode;
  presets?: PricePresetView[];
}

export function CreateOrderForm({
  customers,
  preselectCustomerId,
  defaults,
  notice,
  presets = [],
}: CreateOrderFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const validPreselect =
    preselectCustomerId && customers.some((c) => c.id === preselectCustomerId) ? preselectCustomerId : "";
  const picker = useCustomerPicker({ customers, initialId: validPreselect });

  const form = useForm<OrderFormSchemaValues>({
    resolver: zodResolver(createFormSchema as never),
    defaultValues: {
      customerId: validPreselect,
      title: defaults?.title ?? "",
      status: "Pending",
      totalAmount: 0,
      depositAmount: 0,
      dueDate: defaults?.dueDate ?? "",
      depositMethod: "Cash",
      items: defaults?.items?.length ? defaults.items : [{ ...EMPTY_ITEM }],
    },
  });

  const items = useWatch({ control: form.control, name: "items" });
  const total = Number(useWatch({ control: form.control, name: "totalAmount" })) || 0;
  const deposit = Number(useWatch({ control: form.control, name: "depositAmount" })) || 0;
  const titleSuggestion = suggestTitle(items);

  async function onSubmit(values: OrderFormSchemaValues) {
    setSubmitting(true);
    try {
      const customerId = await picker.resolve();
      if (!customerId) {
        document.getElementById("customer-step")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const result = await createOrder({
        ...values,
        customerId,
        title: values.title.trim() || titleSuggestion || "Order",
      });

      if (result.error) {
        applyFieldErrors(form.setError as never, result.fieldErrors);
        toast.error(result.error, result.fieldErrors?.length ? { description: "Fix the fields marked in red." } : undefined);
        return;
      }
      toast.success(`Order #${result.data!.orderNumber} created`);
      router.push(`/dashboard/orders/${result.data!.orderNumber}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
        {notice}

        <div id="customer-step">
          <FormSection step={1} title="Who is it for?" hint="Search for the customer, or add a new one.">
            {picker.section}
          </FormSection>
        </div>

        <FormSection step={2} title="What are we making?" hint="One row per product. Prices can be added later.">
          <div className="space-y-4">
            <ItemsEditor renderExtras={(i) => <ItemPricingTools index={i} presets={presets} />} />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Order name <span className="font-normal text-on-surface-variant">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={titleSuggestion ? `Leave blank to use “${titleSuggestion}”` : "e.g. Birthday tarpaulin"}
                      className={fieldClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection step={3} title="When is it due?">
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
                  <FormLabel>Where is the job now?</FormLabel>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Starting status">
                    {ORDER_STATUSES.filter((s) => s !== "Completed").map((s) => (
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
                  <p className="text-xs text-on-surface-variant">Most new orders start in Pending.</p>
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection step={4} title="Money" hint="Record the downpayment if the customer paid today.">
          <div className="grid gap-4 sm:grid-cols-2">
            <TotalField />
            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Downpayment received today (₱)</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="decimal" min={0} step="0.01" className={cn(fieldClass, "font-mono")} {...field} />
                  </FormControl>
                  {total > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        ["Half", roundMoney(total / 2)],
                        ["Full", total],
                        ["None", 0],
                      ].map(([label, v]) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => form.setValue("depositAmount", Number(v), { shouldValidate: true })}
                          className="min-h-9 border border-outline-variant/60 px-3 text-xs font-semibold hover:border-on-surface-variant"
                        >
                          {label}
                          {Number(v) > 0 ? ` ${peso(Number(v), false)}` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                  {deposit > total + 0.009 && (
                    <p className="text-xs font-medium text-accent-ink">The downpayment is more than the total.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {deposit > 0 && (
            <div className="mt-4">
              <FormField
                control={form.control}
                name="depositMethod"
                render={({ field }) => (
                  <PaymentMethodPicker
                    method={field.value ?? "Cash"}
                    onMethodChange={field.onChange}
                    reference=""
                    onReferenceChange={() => {}}
                    hideReference
                  />
                )}
              />
            </div>
          )}

          <BalanceLine total={total} paid={deposit} paidLabel="Paid today" />
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
            Create order
          </button>
        </div>
      </form>
    </Form>
  );
}
