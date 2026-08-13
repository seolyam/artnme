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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RecordDepositDialogProps {
  orderId: string;
  currentDeposit: string;
  totalAmount: string;
  orderTitle: string;
  trigger?: React.ReactNode;
}

export function RecordDepositDialog({
  orderId,
  currentDeposit,
  totalAmount,
  orderTitle,
  trigger,
}: RecordDepositDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");

  const currentDep = parseFloat(currentDeposit) || 0;
  const total = parseFloat(totalAmount) || 0;
  const balance = Math.max(0, total - currentDep);

  const parsedAmount = parseFloat(amount) || 0;
  const wouldExceed = parsedAmount > balance + 0.01;
  const isValid = parsedAmount > 0 && !wouldExceed;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    startTransition(async () => {
      const result = await recordDeposit(orderId, parsedAmount);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(
          `₱${parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} recorded`,
          {
            description: `New balance: ₱${Math.max(0, total - result.newDeposit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
        );
        setAmount("");
        setOpen(false);
        router.refresh();
      }
    });
  }

  function quickFill(value: number) {
    setAmount(value.toFixed(2));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="default" size="sm">
            <Banknote className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Add a deposit payment to{" "}
            <span className="font-medium text-foreground">{orderTitle}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-muted/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Total
              </p>
              <p className="font-bold tabular-nums">
                ₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Paid
              </p>
              <p className="font-bold tabular-nums text-emerald-600">
                ₱{currentDep.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-destructive/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Balance
              </p>
              <p className="font-bold tabular-nums text-destructive">
                ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Payment Amount</Label>
            <Input
              id="deposit-amount"
              type="number"
              min={0}
              step="0.01"
              max={balance}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className={wouldExceed ? "border-destructive" : ""}
            />
            {wouldExceed && (
              <p className="text-xs text-destructive">
                Payment exceeds remaining balance of ₱
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Quick fill buttons */}
          {balance > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickFill(balance)}
                disabled={isPending}
              >
                Full Balance (₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })})
              </Button>
              {[500, 1000, 2000, 5000].map((amt) =>
                amt <= balance ? (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickFill(amt)}
                    disabled={isPending}
                  >
                    ₱{amt.toLocaleString()}
                  </Button>
                ) : null,
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !isValid}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
