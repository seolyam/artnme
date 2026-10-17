"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { settleAndComplete } from "@/app/actions/orders";
import { PAYMENT_METHODS, type PaymentMethod } from "@/db/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Pickup counter flow: collect what's owed and close the job in one go. */
export function SettleDialog({
  orderId,
  orderNumber,
  balance,
}: {
  orderId: string;
  orderNumber: number;
  balance: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<Exclude<PaymentMethod, "Adjustment">>("Cash");
  const [reference, setReference] = useState("");
  const [pending, startTransition] = useTransition();
  const owes = balance > 0.009;
  const amount = `₱${balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  function confirm() {
    startTransition(async () => {
      const result = await settleAndComplete(orderId, {
        method,
        reference: reference || undefined,
      });
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Order #${orderNumber} released`, {
        description: owes ? `${amount} collected via ${method}` : "Already fully paid",
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-none bg-success text-white hover:bg-success/90">
          <HandCoins className="mr-2 h-4 w-4" />
          {owes ? "Collect & release" : "Release to customer"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release order #{orderNumber}</DialogTitle>
          <DialogDescription>
            {owes
              ? `Collect the remaining ${amount}, then the order is marked Completed.`
              : "This order is fully paid. Releasing marks it Completed."}
          </DialogDescription>
        </DialogHeader>

        {owes && (
          <div className="space-y-3 py-2">
            <div className="bg-surface-container-low p-4">
              <p className="spec text-[10px] text-on-surface-variant">Collect now</p>
              <p className="font-headline text-3xl font-bold tabular-nums">{amount}</p>
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Payment method">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={method === m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "min-h-9 border px-3 text-xs font-semibold transition-colors",
                      method === m
                        ? "border-brand bg-brand text-white"
                        : "border-outline-variant/60 hover:border-on-surface-variant",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {method !== "Cash" && (
                <Input
                  aria-label="Reference number"
                  placeholder="Reference / transaction no."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  maxLength={80}
                />
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {owes ? `Collect ${amount} & complete` : "Mark completed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
