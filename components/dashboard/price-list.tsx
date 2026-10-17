"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { archivePricePreset, savePricePreset, type PricePresetView } from "@/app/actions/prices";
import { PRODUCT_TYPES } from "@/db/schema";
import { useConfirm } from "@/components/dashboard/confirm-dialog";
import { Input } from "@/components/ui/input";
import { peso } from "@/lib/money";
import { cn } from "@/lib/utils";

type Draft = { id?: string; productType: PricePresetView["productType"]; label: string; unit: PricePresetView["unit"]; price: string };

const UNIT_LABEL = { piece: "per piece", sqft: "per sq ft" } as const;

/** The shop's price list. Everyone can read it; admins can add, edit and remove prices. */
export function PriceList({ presets, isAdmin }: { presets: PricePresetView[]; isAdmin: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();

  function startNew(productType: Draft["productType"]) {
    setDraft({ productType, label: "", unit: productType === "Tarpaulin" ? "sqft" : "piece", price: "" });
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    startTransition(async () => {
      const result = await savePricePreset({ ...draft, price: draft.price });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(draft.id ? "Price updated" : "Price added");
      setDraft(null);
      router.refresh();
    });
  }

  async function remove(p: PricePresetView) {
    const ok = await confirm({
      title: `Remove “${p.label}”?`,
      description: <p>It disappears from the price list and the order form. Orders that already used it don&apos;t change.</p>,
      confirmLabel: "Remove price",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await archivePricePreset(p.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Price removed");
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {dialog}
      {PRODUCT_TYPES.map((type) => {
        const rows = presets.filter((p) => p.productType === type);
        const editingHere = draft?.productType === type;
        return (
          <section key={type} className="bg-surface-container-low p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline text-sm font-bold uppercase tracking-[0.04em]">{type}</h2>
              {isAdmin && !editingHere && (
                <button
                  type="button"
                  onClick={() => startNew(type)}
                  className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add price
                </button>
              )}
            </div>

            {rows.length === 0 && !editingHere && (
              <p className="text-sm text-on-surface-variant">
                {isAdmin ? "No prices yet. Add one so staff can fill it in with one tap." : "No prices set yet."}
              </p>
            )}

            <ul className="divide-y divide-outline-variant/30">
              {rows.map((p) =>
                draft?.id === p.id ? null : (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.label}</span>
                    <span className="font-mono text-sm font-semibold tabular-nums">{peso(p.price)}</span>
                    <span className="w-20 text-xs text-on-surface-variant">{UNIT_LABEL[p.unit]}</span>
                    {isAdmin && (
                      <span className="flex gap-0.5">
                        <button
                          type="button"
                          aria-label={`Edit ${p.label}`}
                          onClick={() => setDraft({ ...p })}
                          className="flex h-9 w-9 items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${p.label}`}
                          onClick={() => remove(p)}
                          className="flex h-9 w-9 items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-accent-ink"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}
                  </li>
                ),
              )}
            </ul>

            {editingHere && draft && (
              <form onSubmit={save} className="mt-3 space-y-3 border border-outline-variant/50 bg-surface-container-lowest p-3">
                <Input
                  autoFocus
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  placeholder={type === "Tarpaulin" ? "e.g. Standard 13oz" : type === "T-Shirt" ? "e.g. Sublimation print" : "e.g. 11oz white mug"}
                  aria-label="Price name"
                  className="h-10 rounded-none"
                />
                <div className="flex flex-wrap gap-2">
                  <div className="relative w-32">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">₱</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      aria-label="Price"
                      className="h-10 rounded-none pl-7 font-mono"
                    />
                  </div>
                  <div className="flex gap-0.5 bg-surface-container-high p-0.5" role="group" aria-label="Charged">
                    {(["piece", "sqft"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        aria-pressed={draft.unit === u}
                        onClick={() => setDraft({ ...draft, unit: u })}
                        className={cn(
                          "spec min-h-9 px-3 text-[10px]",
                          draft.unit === u ? "bg-surface-container-lowest text-on-surface" : "text-on-surface-variant",
                        )}
                      >
                        {UNIT_LABEL[u]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
                    className="inline-flex min-h-9 items-center gap-1 px-3 text-xs text-on-surface-variant hover:text-on-surface"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending || draft.label.trim().length < 2 || draft.price === ""}
                    className="inline-flex min-h-9 items-center gap-1.5 bg-on-surface px-4 text-xs font-semibold text-surface disabled:opacity-50"
                  >
                    {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save
                  </button>
                </div>
              </form>
            )}
          </section>
        );
      })}
    </div>
  );
}
