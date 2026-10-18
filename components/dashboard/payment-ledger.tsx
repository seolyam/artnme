"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { voidPayment } from "@/app/actions/orders";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { peso, toNumber } from "@/lib/money";
import { formatShopDate, formatShopTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export type LedgerEntry = {
  id: string;
  amount: string;
  method: string;
  reference: string | null;
  note: string | null;
  createdAt: Date;
  receivedByName: string | null;
  voidsPaymentId: string | null;
};

/**
 * Payment history for one order. Admins can void an entry: that adds an
 * opposite entry with the reason, and the original is shown struck through.
 */
export function PaymentLedger({ entries, isAdmin }: { entries: LedgerEntry[]; isAdmin: boolean }) {
  const router = useRouter();
  const [target, setTarget] = useState<LedgerEntry | null>(null);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const voided = new Set(entries.map((e) => e.voidsPaymentId).filter(Boolean));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    startTransition(async () => {
      const result = await voidPayment(target.id, reason);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${peso(Math.abs(toNumber(target.amount)))} payment voided`);
      setTarget(null);
      setReason("");
      router.refresh();
    });
  }

  if (entries.length === 0) {
    return <p className="text-xs text-on-surface-variant">No payments recorded yet.</p>;
  }

  return (
    <>
      <ul className="space-y-3">
        {entries.map((p) => {
          const amount = toNumber(p.amount);
          const isVoided = voided.has(p.id);
          const isReversal = !!p.voidsPaymentId;
          return (
            <li key={p.id} className="flex items-start justify-between gap-3 text-xs">
              <div className={cn("min-w-0", isVoided && "opacity-60")}>
                <p className="flex flex-wrap items-center gap-1.5 font-semibold">
                  <span className={cn(isVoided && "line-through")}>{p.method}</span>
                  {p.reference && <span className="font-mono font-normal text-on-surface-variant">#{p.reference}</span>}
                  {isVoided && <span className="spec bg-surface-container-high px-1 py-0.5 text-[9px] text-on-surface-variant">Voided</span>}
                  {isReversal && <span className="spec bg-brand/15 px-1 py-0.5 text-[9px] text-accent-ink">Reversal</span>}
                </p>
                <p className="text-on-surface-variant">
                  {formatShopDate(p.createdAt)} {formatShopTime(p.createdAt)}
                  {p.receivedByName ? ` · ${p.receivedByName}` : ""}
                </p>
                {p.note && <p className="text-on-surface-variant/80">{p.note}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={cn(
                    "font-mono font-semibold tabular-nums",
                    amount < 0 && "text-accent-ink",
                    isVoided && "line-through",
                  )}
                >
                  {amount < 0 ? "−" : ""}
                  {peso(Math.abs(amount))}
                </span>
                {isAdmin && !isVoided && !isReversal && (
                  <button
                    type="button"
                    onClick={() => setTarget(p)}
                    className="inline-flex min-h-7 items-center gap-1 text-[11px] text-on-surface-variant underline-offset-2 hover:text-accent-ink hover:underline"
                  >
                    <Undo2 className="h-3 w-3" />
                    Void
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-headline text-lg font-bold uppercase tracking-[-0.02em]">
              Void this payment?
            </DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              Use this when a payment was recorded by mistake (wrong amount, wrong order, entered twice). The entry
              stays in the history with a matching reversal, and the balance goes back up.
            </DialogDescription>
          </DialogHeader>
          {target && (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-baseline justify-between bg-surface-container-low p-4">
                <div>
                  <p className="font-semibold">{target.method}</p>
                  <p className="text-xs text-on-surface-variant">
                    {formatShopDate(target.createdAt)} {formatShopTime(target.createdAt)}
                    {target.receivedByName ? ` · ${target.receivedByName}` : ""}
                  </p>
                </div>
                <p className="font-headline text-2xl font-bold tabular-nums">{peso(Math.abs(toNumber(target.amount)))}</p>
              </div>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Reason (required)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  maxLength={200}
                  autoFocus
                  placeholder="e.g. Entered twice by mistake"
                  className="w-full border border-outline-variant/60 bg-surface-container-lowest p-3 text-sm outline-none focus:border-on-surface-variant"
                />
              </label>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" className="min-h-10 rounded-none" onClick={() => setTarget(null)} disabled={pending}>
                  Keep it
                </Button>
                <Button
                  type="submit"
                  className="min-h-10 rounded-none bg-brand text-white hover:bg-brand/90"
                  disabled={pending || reason.trim().length < 3}
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Void payment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
