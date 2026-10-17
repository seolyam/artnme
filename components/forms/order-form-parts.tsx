"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { CalendarDays, Clock, Plus, Trash2, X } from "lucide-react";
import { PRODUCT_TYPES } from "@/db/schema";
import type { OrderFormSchemaValues } from "@/lib/validators";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { peso, roundMoney } from "@/lib/money";
import {
  DEFAULT_DUE_TIME,
  addShopDays,
  daysUntil,
  formatShopDate,
  formatShopTime,
  parseShopDateTime,
  shopToday,
} from "@/lib/time";
import { cn } from "@/lib/utils";

export const fieldClass = "h-11 rounded-none bg-surface-container-lowest text-base md:text-sm";

/** A numbered block of the order form ("1 · Who is it for?"). */
export function FormSection({
  step,
  title,
  hint,
  action,
  children,
}: {
  step?: number;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface-container-low p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {step !== undefined && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-on-surface font-headline text-xs font-bold text-surface">
              {step}
            </span>
          )}
          <div>
            <h2 className="font-headline text-base font-bold uppercase tracking-[0.02em]">{title}</h2>
            {hint && <p className="mt-0.5 text-sm text-on-surface-variant">{hint}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ─── Due date ───────────────────────────────────────────────────────────────

const QUICK_DAYS = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "In a week", days: 7 },
];

/**
 * Date and time as separate inputs so picking only a date is enough: the
 * time defaults to 5 PM. The value stays a `YYYY-MM-DDTHH:mm` shop-time
 * string (or "" for no due date), same as the old datetime-local field.
 */
export function DueDateField({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const date = value ? value.slice(0, 10) : "";
  const time = value && value.length >= 16 ? value.slice(11, 16) : DEFAULT_DUE_TIME;
  const today = shopToday();
  const due = parseShopDateTime(value);
  const inDays = due ? daysUntil(due) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {QUICK_DAYS.map((q) => {
          const d = addShopDays(today, q.days);
          return (
            <button
              key={q.label}
              type="button"
              aria-pressed={date === d}
              onClick={() => onChange(`${d}T${time}`)}
              className={cn(
                "min-h-10 border px-3.5 text-sm font-semibold transition-colors",
                date === d
                  ? "border-on-surface bg-on-surface text-surface"
                  : "border-outline-variant/60 hover:border-on-surface-variant",
              )}
            >
              {q.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2 sm:max-w-md sm:grid-cols-[1fr_9rem_auto]">
        <label className="relative col-span-2 sm:col-span-1">
          <span className="sr-only">Due date</span>
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => onChange(e.target.value ? `${e.target.value}T${time}` : "")}
            className="h-11 w-full border border-outline-variant/60 bg-surface-container-lowest pl-9 pr-2 text-base outline-none focus:border-on-surface-variant md:text-sm"
          />
        </label>
        <label className="relative">
          <span className="sr-only">Due time</span>
          <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="time"
            value={time}
            disabled={!date}
            onChange={(e) => date && onChange(`${date}T${e.target.value || DEFAULT_DUE_TIME}`)}
            className="h-11 w-full border border-outline-variant/60 bg-surface-container-lowest pl-9 pr-2 text-base outline-none focus:border-on-surface-variant disabled:opacity-50 md:text-sm"
          />
        </label>
        {date && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear due date"
            className="flex h-11 w-11 items-center justify-center border border-outline-variant/60 text-on-surface-variant hover:border-on-surface-variant hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-sm text-on-surface-variant">
        {due ? (
          <>
            Due <span className="font-semibold text-on-surface">{formatShopDate(due, { weekday: "long", month: "long", day: "numeric" })}</span>{" "}
            at {formatShopTime(due)}
            {inDays !== null && (
              <span className={cn(inDays < 0 && "font-semibold text-accent-ink")}>
                {" "}
                · {inDays < 0 ? `${-inDays} day${inDays === -1 ? "" : "s"} ago` : inDays === 0 ? "today" : inDays === 1 ? "tomorrow" : `in ${inDays} days`}
              </span>
            )}
          </>
        ) : (
          "No due date yet. Pick a day above; the time starts at 5:00 PM."
        )}
      </p>
    </div>
  );
}

// ─── Items ──────────────────────────────────────────────────────────────────

export const EMPTY_ITEM: OrderFormSchemaValues["items"][number] = {
  productType: "T-Shirt",
  description: "",
  quantity: 1,
  dimensions: "",
  unitPrice: 0,
};

const SIZE_HINT: Record<string, string> = {
  Tarpaulin: "e.g. 3ft x 5ft",
  "T-Shirt": "e.g. S×2, M×5, L×3",
  Mug: "e.g. 11oz white",
  Other: "Size / variant",
};

/** Item rows with live line totals. `renderExtras` adds tools under each row. */
export function ItemsEditor({
  renderExtras,
}: {
  renderExtras?: (index: number) => React.ReactNode;
}) {
  const form = useFormContext<OrderFormSchemaValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const items = useWatch({ control: form.control, name: "items" });

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const item = items?.[index];
        const line = (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0);
        return (
          <div key={field.id} className="border border-outline-variant/40 bg-surface-container-lowest p-4" data-testid="order-item">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="spec text-[10px] text-on-surface-variant">Item {index + 1}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold tabular-nums" aria-label={`Item ${index + 1} total`}>
                  {line > 0 ? peso(line) : "—"}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Remove item ${index + 1}`}
                    className="flex h-9 w-9 items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-accent-ink"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1.2fr)_6rem_minmax(0,1fr)_8rem]">
              <FormField
                control={form.control}
                name={`items.${index}.productType`}
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(fieldClass, "w-full")}>
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
                      <Input type="number" inputMode="numeric" min={1} className={fieldClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.unitPrice`}
                render={({ field }) => (
                  <FormItem className="sm:order-last">
                    <FormLabel>Price each (₱)</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="decimal" min={0} step="0.01" className={fieldClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.dimensions`}
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <Input placeholder={SIZE_HINT[item?.productType ?? "Other"]} className={fieldClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {renderExtras?.(index)}

            <FormField
              control={form.control}
              name={`items.${index}.description`}
              render={({ field }) => (
                <FormItem className="mt-3">
                  <FormLabel>Details for the designer</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Colors, text to print, design notes…"
                      className="rounded-none bg-surface-container-lowest text-base md:text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => append({ ...EMPTY_ITEM })}
        className="flex min-h-12 w-full items-center justify-center gap-2 border border-dashed border-outline-variant text-sm font-semibold text-on-surface-variant transition-colors hover:border-on-surface-variant hover:text-on-surface"
      >
        <Plus className="h-4 w-4" />
        Add another item
      </button>
      {form.formState.errors.items?.message && (
        <p className="text-sm font-medium text-accent-ink">{form.formState.errors.items.message}</p>
      )}
    </div>
  );
}

/** Sum of quantity × price over the form's items, rounded to centavos. */
export function useItemsTotal() {
  const form = useFormContext<OrderFormSchemaValues>();
  const items = useWatch({ control: form.control, name: "items" });
  return roundMoney(
    (items ?? []).reduce((sum, it) => sum + (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0), 0),
  );
}

/**
 * The order total follows the items unless someone unlocks it (a discount or
 * a rounded price). Returns the manual flag so the caller can show the state.
 */
export function TotalField({ startManual = false }: { startManual?: boolean }) {
  // Not the whole context object: <Form {...form}> hands out a new one on
  // every render, and depending on it here re-ran the effect forever.
  const { control, setValue } = useFormContext<OrderFormSchemaValues>();
  const itemsTotal = useItemsTotal();
  const [manual, setManual] = useState(startManual);

  useEffect(() => {
    if (!manual) setValue("totalAmount", itemsTotal, { shouldValidate: true });
  }, [itemsTotal, manual, setValue]);

  return (
    <FormField
      control={control}
      name="totalAmount"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-baseline justify-between gap-2">
            <FormLabel>Order total (₱)</FormLabel>
            <button
              type="button"
              onClick={() => setManual((m) => !m)}
              className="text-xs text-on-surface-variant underline-offset-2 hover:text-on-surface hover:underline"
            >
              {manual ? "Use the items total" : "Change total (discount)"}
            </button>
          </div>
          <FormControl>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              readOnly={!manual}
              className={cn(fieldClass, "font-mono font-semibold", !manual && "bg-surface-container text-on-surface-variant")}
              {...field}
            />
          </FormControl>
          <p className="text-xs text-on-surface-variant">
            {manual
              ? Math.abs(Number(field.value) - itemsTotal) > 0.009
                ? `Items add up to ${peso(itemsTotal)}.`
                : "Type the agreed price."
              : "Adds up the items automatically."}
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Big balance read-out under the money fields. */
export function BalanceLine({ total, paid, paidLabel }: { total: number; paid: number; paidLabel: string }) {
  const balance = Math.max(0, roundMoney(total - paid));
  return (
    <div className="mt-5 grid grid-cols-3 gap-0.5 bg-surface-container-high text-sm">
      <div className="bg-surface-container-lowest p-3">
        <p className="spec text-[10px] text-on-surface-variant">Total</p>
        <p className="font-mono font-semibold tabular-nums">{peso(total)}</p>
      </div>
      <div className="bg-surface-container-lowest p-3">
        <p className="spec text-[10px] text-on-surface-variant">{paidLabel}</p>
        <p className="font-mono font-semibold tabular-nums text-success">{peso(paid)}</p>
      </div>
      <div className="bg-surface-container-lowest p-3">
        <p className="spec text-[10px] text-on-surface-variant">Balance</p>
        <p className={cn("font-mono font-bold tabular-nums", balance > 0 ? "text-accent-ink" : "text-success")}>
          {balance > 0 ? peso(balance) : "Paid"}
        </p>
      </div>
    </div>
  );
}

/** Suggested title from the first item, used when staff leave it blank. */
export function suggestTitle(items: OrderFormSchemaValues["items"] | undefined) {
  const list = (items ?? []).filter((it) => it?.productType);
  if (list.length === 0) return "";
  const first = list[0];
  const head = `${Number(first.quantity) || 1}× ${first.productType}`;
  return list.length > 1 ? `${head} + ${list.length - 1} more` : head;
}

/** Map server-side field errors ("items.0.quantity") back onto the form. */
export function applyFieldErrors(
  setError: (name: never, error: { message: string }) => void,
  fieldErrors: { path: string; message: string }[] | undefined,
) {
  for (const fe of fieldErrors ?? []) {
    if (fe.path) setError(fe.path as never, { message: fe.message });
  }
}
