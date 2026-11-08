"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { applyDraftItems, draftFromWebQuote, type WebQuoteDraftResponse } from "@/app/actions/ai-order-draft";
import { OrderDraftResult } from "@/components/ai/order-draft-result";
import type { PriceMemoryRow } from "@/lib/price-memory-rank";

type Success = Extract<WebQuoteDraftResponse, { ok: true }>;

/** On a pending web quote: read the customer's request and turn it into priced items. */
export function WebQuoteTriage({ orderId, priceMemory }: { orderId: string; priceMemory?: PriceMemoryRow[] }) {
  const router = useRouter();
  const [result, setResult] = useState<Success | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, startReading] = useTransition();
  const [applying, startApplying] = useTransition();

  function read() {
    setError(null);
    startReading(async () => {
      try {
        const res = await draftFromWebQuote(orderId);
        if (res.ok) setResult(res);
        else setError(res.message);
      } catch {
        setError("Couldn't read this request. Price it as usual.");
      }
    });
  }

  function apply() {
    if (!result?.draft.defaults.items?.length) return;
    startApplying(async () => {
      const res = await applyDraftItems(orderId, {
        items: result.draft.defaults.items!,
        version: result.version,
        draftDue: result.draft.defaults.dueDate,
      });
      if (res.ok) {
        toast.success("Items applied. Check the prices.");
        setResult(null);
        router.refresh();
      } else {
        setError(res.message);
        if (res.stale) setResult(null);
      }
    });
  }

  return (
    <div className="space-y-3 border border-dashed border-outline-variant/80 p-4">
      {!result && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={read}
            disabled={reading}
            className="inline-flex min-h-10 items-center gap-2 bg-on-surface px-4 text-sm font-semibold text-surface disabled:opacity-50"
          >
            {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {reading ? "Reading…" : "Read this request"}
          </button>
          <span className="text-xs text-on-surface-variant">AI suggests items and prices from what the customer wrote.</span>
        </div>
      )}
      {error && (
        <p className="text-sm font-medium text-accent-ink" role="alert">
          {error}
        </p>
      )}
      {result && (
        <OrderDraftResult
          draft={result.draft}
          priceMemory={priceMemory}
          actions={
            <>
              {(result.draft.defaults.items?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={apply}
                  disabled={applying}
                  className="inline-flex min-h-9 items-center gap-1.5 bg-on-surface px-3 text-xs font-semibold text-surface disabled:opacity-50"
                >
                  {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Apply items
                </button>
              )}
              <button
                type="button"
                onClick={() => setResult(null)}
                className="inline-flex min-h-9 items-center border border-outline-variant/60 px-3 text-xs font-semibold hover:border-on-surface-variant"
              >
                Dismiss
              </button>
            </>
          }
        />
      )}
    </div>
  );
}
