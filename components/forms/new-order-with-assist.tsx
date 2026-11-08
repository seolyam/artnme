"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";
import type { ChatDraftResponse } from "@/app/actions/ai-order-draft";
import type { PricePresetView } from "@/app/actions/prices";
import { ChatPastePanel } from "@/components/ai/chat-paste-panel";
import { OrderDraftResult } from "@/components/ai/order-draft-result";
import type { CustomerOption } from "@/components/forms/customer-combobox";
import type { NewCustomerPrefill } from "@/components/forms/customer-picker";
import { CreateOrderForm, type CreateOrderDefaults } from "@/components/forms/create-order-form";
import type { PriceMemoryRow } from "@/lib/price-memory-rank";

type Success = Extract<ChatDraftResponse, { ok: true }>;
type FormSetup = {
  defaults?: CreateOrderDefaults;
  preselectCustomerId?: string;
  prefillNewCustomer?: NewCustomerPrefill;
};

/**
 * New order page with "Paste a chat" on top. react-hook-form reads its
 * defaultValues once, on mount, so applying a draft means remounting the form
 * with a new `key`; "Undo prefill" remounts it with what it had before.
 */
export function NewOrderWithAssist({
  customers,
  presets,
  notice,
  initial,
  priceMemory,
}: {
  customers: CustomerOption[];
  presets: PricePresetView[];
  priceMemory?: PriceMemoryRow[];
  notice?: React.ReactNode;
  /** What the page would show without AI (e.g. "Order again" defaults). */
  initial: FormSetup;
}) {
  const [setup, setSetup] = useState<FormSetup>(initial);
  const [previous, setPrevious] = useState<FormSetup | null>(null);
  const [result, setResult] = useState<Success | null>(null);
  const [version, setVersion] = useState(0);

  function apply(res: Success) {
    setPrevious((p) => p ?? setup);
    setResult(res);
    setSetup({
      defaults: res.draft.defaults,
      preselectCustomerId: res.customer?.kind === "matched" ? res.customer.id : undefined,
      prefillNewCustomer: res.customer?.kind === "new" ? res.customer : undefined,
    });
    setVersion((v) => v + 1);
  }

  function undo() {
    if (!previous) return;
    setSetup(previous);
    setPrevious(null);
    setResult(null);
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-6">
      <ChatPastePanel defaultOpen={!initial.defaults} onDraft={apply}>
        {result && (
          <OrderDraftResult
            draft={result.draft}
            customer={result.customer}
            messengerLink={result.messengerLink}
            priceMemory={priceMemory}
            actions={
              previous ? (
                <button
                  type="button"
                  onClick={undo}
                  className="inline-flex min-h-9 items-center gap-1.5 border border-outline-variant/60 px-3 text-xs font-semibold hover:border-on-surface-variant"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Undo prefill
                </button>
              ) : null
            }
          />
        )}
      </ChatPastePanel>

      <CreateOrderForm
        key={version}
        customers={customers}
        presets={presets}
        defaults={setup.defaults}
        preselectCustomerId={setup.preselectCustomerId}
        prefillNewCustomer={setup.prefillNewCustomer}
        priceMemory={priceMemory}
        notice={result ? undefined : notice}
      />
    </div>
  );
}
