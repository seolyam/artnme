"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Pencil, Search } from "lucide-react";
import { CustomerDialog } from "@/components/dashboard/customer-dialog";
import { peso } from "@/lib/money";
import { formatContact, normalizeContact } from "@/lib/phone";
import { formatShopDate } from "@/lib/time";
import { cn } from "@/lib/utils";

interface CustomerRow {
  id: string;
  name: string;
  contactNumber: string | null;
  fbMessengerLink: string | null;
  createdAt: Date;
  orderCount: number;
  activeCount: number;
  totalRevenue: number;
  balance: number;
  lastOrderAt: Date | null;
}

type Filter = "all" | "owes" | "active";

export function CustomersTable({ customers, isAdmin }: { customers: CustomerRow[]; isAdmin: boolean }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const options = useMemo(
    () => customers.map((c) => ({ id: c.id, name: c.name, contactNumber: c.contactNumber })),
    [customers],
  );

  const q = search.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  const filtered = customers.filter((c) => {
    const matchesSearch =
      q === "" ||
      c.name.toLowerCase().includes(q) ||
      (qDigits.length >= 3 && normalizeContact(c.contactNumber).replace(/\D/g, "").includes(normalizeContact(qDigits).replace(/\D/g, ""))) ||
      (c.contactNumber ?? "").toLowerCase().includes(q);
    const matchesFilter =
      filter === "all" || (filter === "owes" ? c.balance > 0.009 : c.activeCount > 0);
    return matchesSearch && matchesFilter;
  });

  const owesCount = customers.filter((c) => c.balance > 0.009).length;
  const activeCount = customers.filter((c) => c.activeCount > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant" />
          <input
            type="search"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search customers"
            className="h-10 w-full border border-outline-variant/60 bg-surface-container-lowest pl-9 pr-3 text-sm outline-none focus:border-on-surface-variant"
          />
        </div>
        <div className="flex gap-0.5 bg-surface-container-high p-0.5" role="group" aria-label="Show">
          {(
            [
              ["all", `All · ${customers.length}`],
              ["owes", `Owes money · ${owesCount}`],
              ["active", `Active jobs · ${activeCount}`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "spec min-h-10 flex-1 px-3 text-[10px] tracking-[0.08em] transition-colors sm:flex-none",
                filter === value ? "bg-surface-container-lowest text-on-surface" : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="halftone flex items-center justify-center bg-surface-container-low py-16 [--dot:var(--surface-high)]">
          <p className="bg-background px-4 py-2 text-center text-sm text-on-surface-variant">
            {customers.length === 0
              ? "No customers yet. They're added when you take an order, or with “Add customer”."
              : search
                ? `No customer matches “${search}”.`
                : "Nobody here right now."}
          </p>
        </div>
      ) : (
        <div className="border border-outline-variant/30">
          <div className="spec hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_5rem_8rem_8rem_5.5rem] gap-4 border-b border-outline-variant/30 bg-surface-container-low px-4 py-2 text-[10px] text-on-surface-variant md:grid">
            <span>Customer</span>
            <span>Contact</span>
            <span className="text-right">Orders</span>
            <span className="text-right">Owes</span>
            <span className="text-right">Lifetime</span>
            <span />
          </div>
          <ul className="divide-y divide-outline-variant/30">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="group relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 bg-surface-container-lowest px-4 py-3.5 transition-colors hover:bg-surface-container md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_5rem_8rem_8rem_5.5rem]"
              >
                <div className="min-w-0">
                  {/* Stretched link: the whole row opens the customer. */}
                  <Link
                    href={`/dashboard/customers/${c.id}`}
                    prefetch={false}
                    className="block truncate font-semibold after:absolute after:inset-0 group-hover:text-accent-ink"
                  >
                    {c.name}
                  </Link>
                  <p className="truncate text-xs text-on-surface-variant md:hidden">
                    {c.contactNumber ? formatContact(c.contactNumber) : "No contact"} · {c.orderCount} order
                    {c.orderCount === 1 ? "" : "s"}
                  </p>
                  {c.lastOrderAt && (
                    <p className="hidden text-xs text-on-surface-variant md:block">
                      Last order {formatShopDate(c.lastOrderAt, { month: "short", day: "numeric", year: "numeric" })}
                      {c.activeCount > 0 && ` · ${c.activeCount} active`}
                    </p>
                  )}
                </div>
                <span className="hidden truncate font-mono text-sm md:block">
                  {c.contactNumber ? formatContact(c.contactNumber) : <span className="text-on-surface-variant">—</span>}
                </span>
                <span className="hidden text-right font-mono text-sm tabular-nums md:block">{c.orderCount}</span>
                <span
                  className={cn(
                    "text-right font-mono text-sm font-semibold tabular-nums",
                    c.balance > 0.009 ? "text-accent-ink" : "text-on-surface-variant",
                  )}
                >
                  {c.balance > 0.009 ? peso(c.balance) : "—"}
                </span>
                <span className="hidden text-right font-mono text-sm tabular-nums md:block">{peso(c.totalRevenue, false)}</span>
                <div className="relative z-10 hidden items-center justify-end gap-1 md:flex">
                  <CustomerDialog
                    customer={c}
                    others={options}
                    isAdmin={isAdmin}
                    trigger={
                      <button
                        type="button"
                        aria-label={`Edit ${c.name}`}
                        className="flex h-9 w-9 items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    }
                  />
                  <ChevronRight className="h-4 w-4 text-on-surface-variant" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
