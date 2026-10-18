"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createCustomer, deleteCustomer, updateCustomer } from "@/app/actions/customers";
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
import { useConfirm } from "@/components/dashboard/confirm-dialog";
import { findDuplicateCustomer } from "@/components/forms/customer-picker";
import type { CustomerOption } from "@/components/forms/customer-combobox";
import { formatContact } from "@/lib/phone";

type EditableCustomer = {
  id: string;
  name: string;
  contactNumber: string | null;
  fbMessengerLink: string | null;
  orderCount?: number;
};

/**
 * Add or edit a customer. With `customer` it edits (and lets admins delete a
 * customer who has no orders); without, it creates. `others` powers the
 * "already a customer?" warning.
 */
export function CustomerDialog({
  customer,
  others = [],
  isAdmin = false,
  trigger,
  afterDelete,
}: {
  customer?: EditableCustomer;
  others?: CustomerOption[];
  isAdmin?: boolean;
  trigger: React.ReactNode;
  afterDelete?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  const [name, setName] = useState(customer?.name ?? "");
  const [contact, setContact] = useState(customer?.contactNumber ?? "");
  const [messenger, setMessenger] = useState(customer?.fbMessengerLink ?? "");

  const editing = !!customer;
  const duplicate = findDuplicateCustomer(
    others.filter((c) => c.id !== customer?.id),
    name,
    contact,
  );

  function reset() {
    setName(customer?.name ?? "");
    setContact(customer?.contactNumber ?? "");
    setMessenger(customer?.fbMessengerLink ?? "");
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const values = {
      name: name.trim(),
      contactNumber: contact.trim() || undefined,
      fbMessengerLink: messenger.trim() || undefined,
    };
    startTransition(async () => {
      const result = editing ? await updateCustomer(customer.id, values) : await createCustomer(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Customer saved" : `${values.name} added`);
      setOpen(false);
      if (!editing) reset();
      router.refresh();
    });
  }

  async function remove() {
    if (!customer) return;
    const ok = await confirm({
      title: `Delete ${customer.name}?`,
      description: <p>This removes the customer record. It can&apos;t be undone.</p>,
      confirmLabel: "Delete customer",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteCustomer(customer.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${customer.name} deleted`);
      setOpen(false);
      afterDelete?.();
      router.refresh();
    });
  }

  const canDelete = editing && isAdmin && (customer.orderCount ?? 0) === 0;

  return (
    <>
      {dialog}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) reset();
        }}
      >
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-headline text-lg font-bold uppercase tracking-[-0.02em]">
              {editing ? "Edit customer" : "Add customer"}
            </DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              {editing ? "Fix the name or contact details." : "Save someone before their first order, e.g. a walk-in asking for a quote."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Name *</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 rounded-none" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Phone or email</span>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                inputMode="tel"
                placeholder="0917 123 4567"
                className="h-11 rounded-none"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                Messenger link <span className="font-normal text-on-surface-variant">(optional)</span>
              </span>
              <Input
                value={messenger}
                onChange={(e) => setMessenger(e.target.value)}
                placeholder="https://m.me/…"
                className="h-11 rounded-none"
              />
            </label>

            {duplicate && (
              <p className="flex gap-2 border border-[#f2b33d]/60 bg-[#f2b33d]/10 p-3 text-sm" role="alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-[#f2b33d]" />
                <span>
                  <span className="font-semibold">{duplicate.customer.name}</span>
                  {duplicate.customer.contactNumber && ` (${formatContact(duplicate.customer.contactNumber)})`} already
                  has this {duplicate.reason === "phone" ? "number" : "name"}. Check it isn&apos;t the same person.
                </span>
              </p>
            )}

            <DialogFooter className="gap-2 sm:items-center">
              {canDelete && (
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="mr-auto inline-flex min-h-10 items-center gap-1.5 text-sm text-on-surface-variant hover:text-accent-ink"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
              <Button type="button" variant="outline" className="min-h-10 rounded-none" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" className="min-h-10 rounded-none" disabled={pending || !name.trim()}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save" : "Add customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
