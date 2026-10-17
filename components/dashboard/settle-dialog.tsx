"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { settleAndComplete } from "@/app/actions/orders";
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
import { PaymentMethodPicker, type ReceivedMethod } from "@/components/dashboard/payment-method-picker";
import { peso } from "@/lib/money";

/**
 * Pickup counter flow: collect what's owed and close the job in one go.
 *
 * Renders its own button by default. Pass `open`/`onOpenChange` (and
 * `hideTrigger`) to open it from elsewhere, e.g. when someone moves an unpaid
 * job to Completed; `onSkip` then adds a "complete without collecting" exit.
 */
export function SettleDialog({
  orderId,
  orderNumber,
  balance,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
  onSkip,
  onDone,
}: {
  orderId: string;
  orderNumber: number;
  balance: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  onSkip?: () => void;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [method, setMethod] = useState<ReceivedMethod>("Cash");
  const [reference, setReference] = useState("");
  const [pending, startTransition] = useTransition();
  const owes = balance > 0.009;
  const amount = peso(balance);

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
      setReference("");
      onDone?.();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="min-h-10 rounded-none bg-success text-white hover:bg-success/90">
            <HandCoins className="h-4 w-4" />
            {owes ? "Collect & release" : "Release to customer"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg font-bold uppercase tracking-[-0.02em]">
            Release order #{orderNumber}
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            {owes
              ? `The customer still owes ${amount}. Collect it now and the order is marked Completed.`
              : "This order is fully paid. Releasing marks it Completed."}
          </DialogDescription>
        </DialogHeader>

        {owes && (
          <div className="space-y-4 py-1">
            <div className="bg-surface-container-low p-4">
              <p className="spec text-[10px] text-on-surface-variant">Collect now</p>
              <p className="font-headline text-3xl font-bold tabular-nums">{amount}</p>
            </div>
            <PaymentMethodPicker
              method={method}
              onMethodChange={setMethod}
              reference={reference}
              onReferenceChange={setReference}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:items-center">
          {onSkip && owes && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                onSkip();
              }}
              className="mr-auto min-h-10 text-left text-xs text-on-surface-variant underline-offset-2 hover:text-on-surface hover:underline disabled:opacity-50"
            >
              Complete without collecting
            </button>
          )}
          <Button type="button" variant="outline" className="min-h-10 rounded-none" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" className="min-h-10 rounded-none" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {owes ? `Collect ${amount} & complete` : "Mark completed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
