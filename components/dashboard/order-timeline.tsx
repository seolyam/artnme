"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Banknote,
  Paperclip,
  Loader2,
  PenLine,
  Plus,
  RotateCcw,
  StickyNote,
  Trash2,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { addOrderNote } from "@/app/actions/orders";
import { formatShopDate, formatShopTime, timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

type TimelineEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
  actorName: string | null;
};

const ICONS: Record<string, LucideIcon> = {
  created: Plus,
  status: ArrowRightLeft,
  payment: Banknote,
  edit: PenLine,
  note: StickyNote,
  assigned: UserRound,
  deleted: Trash2,
  restored: RotateCcw,
  file: Paperclip,
};

export function OrderTimeline({
  orderId,
  events,
}: {
  orderId: string;
  events: TimelineEvent[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [notesOnly, setNotesOnly] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    startTransition(async () => {
      const result = await addOrderNote(orderId, note);
      if (result.error) toast.error(result.error);
      else {
        setNote("");
        router.refresh();
      }
    });
  }

  const shown = notesOnly ? events.filter((e) => e.type === "note") : events;

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <textarea
          aria-label="Add an internal note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
          }}
          rows={2}
          maxLength={1000}
          placeholder="Internal note — e.g. “Customer wants the logo bigger”, “Paid GCash, waiting for ref”"
          className="w-full resize-y border border-outline-variant/50 bg-surface-container-lowest p-3 text-sm outline-none focus:border-on-surface-variant"
        />
        <div className="flex items-center justify-between gap-2">
          <label className="spec flex items-center gap-2 text-[10px] text-on-surface-variant">
            <input
              type="checkbox"
              checked={notesOnly}
              onChange={(e) => setNotesOnly(e.target.checked)}
              className="accent-[var(--color-brand)]"
            />
            Notes only
          </label>
          <button
            type="submit"
            disabled={pending || !note.trim()}
            className="inline-flex min-h-9 items-center gap-1.5 bg-on-surface px-4 font-headline text-[11px] font-bold uppercase tracking-[0.1em] text-surface transition-opacity disabled:opacity-40"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Add note
          </button>
        </div>
      </form>

      {shown.length === 0 ? (
        <p className="spec border border-dashed border-outline-variant/50 px-3 py-6 text-center text-[10px] text-on-surface-variant">
          {notesOnly ? "No notes yet" : "No activity yet"}
        </p>
      ) : (
        <ol className="relative space-y-0">
          {shown.map((ev, i) => {
            const Icon = ICONS[ev.type] ?? PenLine;
            const isNote = ev.type === "note";
            return (
              <li key={ev.id} className="relative flex gap-3 pb-4">
                {i !== shown.length - 1 && (
                  <span className="absolute bottom-0 left-[13px] top-7 w-px bg-outline-variant/50" />
                )}
                <span
                  className={cn(
                    "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center",
                    isNote
                      ? "bg-[#f2b33d]/20 text-amber-700 dark:text-[#f2b33d]"
                      : ev.type === "payment"
                        ? "bg-success/15 text-success"
                        : "bg-surface-container-high text-on-surface-variant",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={cn(
                      "text-sm",
                      isNote && "whitespace-pre-wrap border-l-2 border-[#f2b33d] bg-surface-container-low px-3 py-2",
                    )}
                  >
                    {ev.message}
                  </p>
                  <p
                    suppressHydrationWarning
                    className="mt-1 text-xs text-on-surface-variant"
                    title={`${formatShopDate(ev.createdAt, { month: "long", day: "numeric", year: "numeric" })} ${formatShopTime(ev.createdAt)}`}
                  >
                    {ev.actorName ?? (ev.type === "created" ? "Website" : "System")} · {timeAgo(ev.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
