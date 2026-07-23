"use client";

import { useState, useTransition } from "react";
import {
  updateCustomer,
  deleteCustomer,
} from "@/app/actions/customers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Search, Pencil, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface CustomerRow {
  id: string;
  name: string;
  contactNumber: string | null;
  fbMessengerLink: string | null;
  createdAt: Date;
  orderCount: number;
  totalRevenue: number;
}

export function CustomersTable({
  customers,
}: {
  customers: CustomerRow[];
}) {
  const [search, setSearch] = useState("");
  const [editCustomer, setEditCustomer] = useState<CustomerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);
  const [isPending, startTransition] = useTransition();

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editMessenger, setEditMessenger] = useState("");

  function openEdit(customer: CustomerRow) {
    setEditName(customer.name);
    setEditContact(customer.contactNumber || "");
    setEditMessenger(customer.fbMessengerLink || "");
    setEditCustomer(customer);
  }

  function handleSave() {
    if (!editCustomer) return;
    startTransition(async () => {
      const result = await updateCustomer(editCustomer.id, {
        name: editName,
        contactNumber: editContact || undefined,
        fbMessengerLink: editMessenger || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Customer updated");
        setEditCustomer(null);
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCustomer(deleteTarget.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Customer deleted");
        setDeleteTarget(null);
      }
    });
  }

  const filtered = customers.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactNumber &&
        c.contactNumber.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {search
                ? "No customers match your search."
                : "No customers yet. They will appear here when you create orders."}
            </p>
          ) : (
            <div className="grid gap-2">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/customers/${c.id}`}
                  prefetch={true}
                  className="relative grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-start md:items-center bg-[color:var(--color-surface-container-low)] hover:bg-[color:var(--color-surface-container-highest)] transition-colors border-l-2 border-l-transparent hover:border-l-primary group cursor-pointer"
                >
                  <div className="md:col-span-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Client Name</p>
                    <p className="font-bold text-lg leading-none text-foreground">{c.name}</p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Contact</p>
                    <p className="text-sm font-medium">{c.contactNumber || "\u2014"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Network</p>
                    {c.fbMessengerLink ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(
                            c.fbMessengerLink!,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                        className="text-primary text-sm font-semibold hover:underline text-left"
                      >
                        Messenger
                      </button>
                    ) : (
                      <span className="text-sm text-muted-foreground">\u2014</span>
                    )}
                  </div>
                  <div className="md:col-span-1 text-right">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Orders</p>
                    <p className="text-base font-bold text-foreground">{c.orderCount}</p>
                  </div>
                  <div className="md:col-span-2 text-right">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Lifetime Value</p>
                    <p className="font-bold text-primary text-lg leading-none">
                      {"\u20B1"}{c.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1 bg-[color:var(--color-surface-container-highest)] pl-4"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        openEdit(c);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteTarget(c);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editCustomer}
        onOpenChange={(open) => !open && setEditCustomer(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact">Contact Number</Label>
              <Input
                id="edit-contact"
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-messenger">Messenger Link</Label>
              <Input
                id="edit-messenger"
                value={editMessenger}
                onChange={(e) => setEditMessenger(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditCustomer(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending || !editName.trim()}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && deleteTarget.orderCount > 0 && (
            <p className="text-sm text-destructive">
              This customer has {deleteTarget.orderCount} order
              {deleteTarget.orderCount !== 1 ? "s" : ""}. You must delete
              their orders first.
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
