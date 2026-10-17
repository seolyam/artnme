"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordDeposit } from "@/app/actions/orders";
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
import { Label } from "@/components/ui/label";
import { PaymentMethodPicker, type ReceivedMethod } from "@/components/dashboard/payment-method-picker";
import { peso, roundMoney, toNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RecordDepositDialogProps {
  orderId: string;
  currentDeposit: string;
  totalAmount: string;
  orderTitle: string;
  orderNumber?: number;
  trigger?: React.ReactNode;
}

export function RecordDepositDialog({
  orderId,
  currentDeposit,
  totalAmount,
  orderTitle,
  orderNumber,
  trigger,
}: RecordDepositDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<ReceivedMethod>("Cash");
  const [reference, setReference] = useState("");

  const paid = toNumber(currentDeposit);
  const total = toNumber(totalAmount);
  const balance = Math.max(0, roundMoney(total - paid));

  const parsedAmount = parseFloat(amount) || 0;
  const wouldExceed = parsedAmount > balance + 0.009;
  const isValid = parsedAmount > 0 && !wouldExceed;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    startTransition(async () => {
      const result = await recordDeposit(orderId, parsedAmount, {
        method,
        reference: reference || undefined,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        const left = Math.max(0, total - result.newDeposit);
        toast.success(`${peso(parsedAmount)} recorded`, {
          description: left > 0.009 ? `${peso(left)} still to pay` : "Fully paid",
        });
        setAmount("");
        setReference("");
        setOpen(false);
        router.refresh();
      }
    });
  }

  const quick = [balance, ...[500, 1000, 2000, 5000].filter((v) => v < balance)];
  if (balance > 0 && !quick.includes(roundMoney(balance / 2)) && balance >= 200) {
    quick.splice(1, 0, roundMoney(balance / 2));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="min-h-10 rounded-none">
            <Banknote className="h-4 w-4" />
            Record payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline text-lg font-bold uppercase tracking-[-0.02em]">
            <Banknote className="h-5 w-5" />
            Record payment
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            Money received for{" "}
            <span className="font-medium text-on-surface">
              {orderNumber ? `#${orderNumber} · ` : ""}
              {orderTitle}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-0.5 bg-surface-container-high text-sm">
            <Figure label="Total" value={peso(total)} />
            <Figure label="Paid" value={peso(paid)} className="text-success" />
            <Figure label="Still owed" value={peso(balance)} className="text-accent-ink" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit-amount" className="text-sm">
              Amount received
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-headline text-lg text-on-surface-variant">
                ₱
              </span>
              <input
                id="deposit-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                max={balance}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                aria-invalid={wouldExceed}
                className={cn(
                  "h-14 w-full border bg-surface-container-lowest pl-8 pr-3 font-headline text-2xl font-bold tabular-nums outline-none focus:border-on-surface-variant",
                  wouldExceed ? "border-brand" : "border-outline-variant/60",
                )}
              />
            </div>
            {wouldExceed && (
              <p className="text-xs font-medium text-accent-ink">
                That&apos;s more than the {peso(balance)} still owed.
              </p>
            )}
            {balance > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quick.map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v.toFixed(2))}
                    disabled={isPending}
                    className="min-h-9 border border-outline-variant/60 px-3 text-xs font-semibold transition-colors hover:border-on-surface-variant"
                  >
                    {i === 0 ? `Full ${peso(v)}` : v === roundMoney(balance / 2) ? `Half ${peso(v)}` : peso(v, false)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <PaymentMethodPicker
            method={method}
            onMethodChange={setMethod}
            reference={reference}
            onReferenceChange={setReference}
          />

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-10 rounded-none"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="min-h-10 rounded-none" disabled={isPending || !isValid}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {parsedAmount > 0 && !wouldExceed ? `Record ${peso(parsedAmount)}` : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Figure({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="bg-surface-container-low p-3">
      <p className="spec text-[10px] text-on-surface-variant">{label}</p>
      <p className={cn("font-mono font-bold tabular-nums", className)}>{value}</p>
    </div>
  );
}
