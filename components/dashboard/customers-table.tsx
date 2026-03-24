"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Users, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Messenger</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/customers/${c.id}`} className="hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell>{c.contactNumber || "\u2014"}</TableCell>
                    <TableCell>
                      {c.fbMessengerLink ? (
                        <a
                          href={c.fbMessengerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-4"
                        >
                          Open
                        </a>
                      ) : (
                        "\u2014"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.orderCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {"\u20B1"}
                      {c.totalRevenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
