"use client";

import { useId, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Phone, Search, UserPlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatContact, normalizeContact } from "@/lib/phone";
import { cn } from "@/lib/utils";

export type CustomerOption = { id: string; name: string; contactNumber: string | null };

const MAX_SHOWN = 50;

/**
 * Type-to-search customer picker. Matches names anywhere and phone numbers
 * however they were typed (0917…, +63917…). The last row always offers to
 * add the typed name as a new customer.
 */
export function CustomerCombobox({
  customers,
  value,
  onChange,
  onCreateNew,
  invalid = false,
}: {
  customers: CustomerOption[];
  value: string;
  onChange: (id: string) => void;
  onCreateNew: (typedName: string) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const selected = customers.find((c) => c.id === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, MAX_SHOWN);
    const qDigits = q.replace(/\D/g, "");
    const qPhone = qDigits.length >= 3 ? normalizeContact(qDigits).replace(/\D/g, "") : "";
    return customers
      .filter((c) => {
        if (c.name.toLowerCase().includes(q)) return true;
        if (!qPhone || !c.contactNumber) return false;
        const digits = normalizeContact(c.contactNumber).replace(/\D/g, "");
        return digits.includes(qPhone) || digits.includes(qDigits);
      })
      .sort((a, b) => {
        // Names that start with the query first.
        const as = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bs = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return as - bs || a.name.localeCompare(b.name);
      })
      .slice(0, MAX_SHOWN);
  }, [customers, query]);

  // Rows: matches, then the "add new" row.
  const rowCount = matches.length + 1;

  function pick(index: number) {
    if (index < matches.length) {
      onChange(matches[index].id);
      setOpen(false);
      setQuery("");
    } else {
      onCreateNew(query.trim());
      setOpen(false);
      setQuery("");
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(rowCount - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(active);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setActive(0);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={invalid}
          aria-label="Customer"
          className={cn(
            "flex min-h-12 w-full items-center gap-3 border bg-surface-container-lowest px-3 text-left text-sm transition-colors hover:border-on-surface-variant",
            invalid ? "border-brand" : "border-outline-variant/60",
          )}
        >
          {selected ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{selected.name}</span>
              {selected.contactNumber && (
                <span className="block truncate text-xs text-on-surface-variant">
                  {formatContact(selected.contactNumber)}
                </span>
              )}
            </span>
          ) : (
            <span className="flex-1 text-on-surface-variant">Search by name or phone…</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-on-surface-variant" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <div className="flex items-center gap-2 border-b border-outline-variant/40 px-3">
          <Search className="h-4 w-4 shrink-0 text-on-surface-variant" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Type a name or number…"
            aria-label="Search customers"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-on-surface-variant/70"
          />
        </div>
        <div id={listId} role="listbox" className="max-h-72 overflow-y-auto py-1">
          {matches.length === 0 && query.trim() && (
            <p className="px-3 py-3 text-sm text-on-surface-variant">No customer matches “{query.trim()}”.</p>
          )}
          {matches.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={c.id === value}
              onMouseMove={() => setActive(i)}
              onClick={() => pick(i)}
              className={cn(
                "flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm",
                i === active && "bg-surface-container-high",
              )}
            >
              <Check className={cn("h-4 w-4 shrink-0", c.id === value ? "text-brand" : "opacity-0")} />
              <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
              {c.contactNumber && (
                <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-on-surface-variant">
                  <Phone className="h-3 w-3" />
                  {formatContact(c.contactNumber)}
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            role="option"
            aria-selected={false}
            onMouseMove={() => setActive(matches.length)}
            onClick={() => pick(matches.length)}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 border-t border-outline-variant/30 px-3 text-left text-sm font-semibold text-accent-ink",
              active === matches.length && "bg-surface-container-high",
            )}
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            {query.trim() ? `Add “${query.trim()}” as a new customer` : "Add a new customer"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
