"use client";

import { useState } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createCustomer } from "@/app/actions/customers";
import { CustomerCombobox, type CustomerOption } from "@/components/forms/customer-combobox";
import { fieldClass } from "@/components/forms/order-form-parts";
import { Input } from "@/components/ui/input";
import { formatContact, normalizeContact } from "@/lib/phone";
import { cn } from "@/lib/utils";

function sameName(a: string, b: string) {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return norm(a) !== "" && norm(a) === norm(b);
}

/** An existing customer that looks like the one being typed in, if any. */
export function findDuplicateCustomer(customers: CustomerOption[], name: string, contact: string) {
  const key = normalizeContact(contact);
  const byContact = key.length >= 7 ? customers.find((c) => normalizeContact(c.contactNumber) === key) : undefined;
  if (byContact) return { customer: byContact, reason: "phone" as const };
  const byName = customers.find((c) => sameName(c.name, name));
  if (byName) return { customer: byName, reason: "name" as const };
  return null;
}

/**
 * Customer step of the order forms: search existing customers, or type a new
 * one in. `resolve()` returns the id to save with the order, creating the new
 * customer first if needed (and switching to it, so a retry won't create a
 * second copy).
 */
export function useCustomerPicker({
  customers: initialCustomers,
  initialId = "",
}: {
  customers: CustomerOption[];
  initialId?: string;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [customerId, setCustomerId] = useState(initialId);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [messenger, setMessenger] = useState("");
  const [error, setError] = useState<string | null>(null);

  const duplicate = mode === "new" ? findDuplicateCustomer(customers, name, contact) : null;

  function selectExisting(id: string) {
    setCustomerId(id);
    setMode("existing");
    setError(null);
  }

  async function resolve(): Promise<string | null> {
    if (mode === "existing") {
      if (!customerId) {
        setError("Choose who the order is for.");
        return null;
      }
      return customerId;
    }
    if (!name.trim()) {
      setError("Type the customer's name.");
      return null;
    }
    const res = await createCustomer({
      name: name.trim(),
      contactNumber: contact.trim() || undefined,
      fbMessengerLink: messenger.trim() || undefined,
    });
    if (res.error || !res.data) {
      toast.error(res.error ?? "Couldn't save the new customer");
      return null;
    }
    const created = res.data;
    setCustomers((list) => [...list, { id: created.id, name: created.name, contactNumber: created.contactNumber }]);
    selectExisting(created.id);
    return created.id;
  }

  const section = (
    <div className="space-y-3">
      {mode === "existing" ? (
        <>
          <CustomerCombobox
            customers={customers}
            value={customerId}
            invalid={!!error}
            onChange={(id) => {
              setCustomerId(id);
              setError(null);
            }}
            onCreateNew={(typed) => {
              setMode("new");
              setName(typed && !/^\+?[\d\s-]+$/.test(typed) ? typed : "");
              setContact(typed && /^\+?[\d\s-]+$/.test(typed) ? typed : "");
              setError(null);
            }}
          />
          <p className="text-xs text-on-surface-variant">
            New customer? Pick <span className="font-semibold">Add a new customer</span> at the bottom of the list.
          </p>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Name *</span>
              <Input
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Juan Dela Cruz"
                aria-invalid={!!error}
                className={fieldClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Phone or email</span>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                inputMode="tel"
                placeholder="0917 123 4567"
                className={fieldClass}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium">
                Messenger link <span className="font-normal text-on-surface-variant">(optional)</span>
              </span>
              <Input
                value={messenger}
                onChange={(e) => setMessenger(e.target.value)}
                placeholder="https://m.me/…"
                className={fieldClass}
              />
            </label>
          </div>

          {duplicate && (
            <div className="flex flex-col gap-3 border border-[#f2b33d]/60 bg-[#f2b33d]/10 p-4 sm:flex-row sm:items-center" role="alert">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700 dark:text-[#f2b33d]" />
              <p className="flex-1 text-sm">
                <span className="font-semibold">Already a customer?</span>{" "}
                <span className="font-semibold">{duplicate.customer.name}</span>
                {duplicate.customer.contactNumber && ` · ${formatContact(duplicate.customer.contactNumber)}`} has the
                same {duplicate.reason === "phone" ? "phone number" : "name"}.
              </p>
              <button
                type="button"
                onClick={() => selectExisting(duplicate.customer.id)}
                className="min-h-10 shrink-0 bg-on-surface px-4 text-sm font-semibold text-surface"
              >
                Use {duplicate.customer.name.split(/\s+/)[0]}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setMode("existing");
              setError(null);
            }}
            className="inline-flex min-h-9 items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to customer search
          </button>
        </>
      )}
      {error && <p className={cn("text-sm font-medium text-accent-ink")}>{error}</p>}
    </div>
  );

  return { section, resolve, mode };
}
