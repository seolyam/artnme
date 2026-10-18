"use client";

import { PAYMENT_METHODS, type PaymentMethod } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ReceivedMethod = Exclude<PaymentMethod, "Adjustment">;

/** Big tap-friendly method buttons, plus a reference field for e-wallets and banks. */
export function PaymentMethodPicker({
  method,
  onMethodChange,
  reference,
  onReferenceChange,
  hideReference = false,
}: {
  method: ReceivedMethod;
  onMethodChange: (m: ReceivedMethod) => void;
  reference: string;
  onReferenceChange: (r: string) => void;
  hideReference?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Paid with</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Payment method">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={method === m}
            onClick={() => onMethodChange(m)}
            className={cn(
              "min-h-10 border px-3.5 text-sm font-semibold transition-colors",
              method === m
                ? "border-brand bg-brand text-white"
                : "border-outline-variant/60 hover:border-on-surface-variant",
            )}
          >
            {m}
          </button>
        ))}
      </div>
      {method !== "Cash" && !hideReference && (
        <Input
          aria-label="Reference number"
          placeholder={
            method === "GCash" || method === "Maya"
              ? "Reference no. (from the customer's receipt) — optional"
              : "Reference / transaction no. — optional"
          }
          value={reference}
          onChange={(e) => onReferenceChange(e.target.value)}
          maxLength={80}
          className="h-10 rounded-none"
        />
      )}
    </div>
  );
}
