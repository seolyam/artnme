"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { draftOrderFromChat, type ChatDraftResponse } from "@/app/actions/ai-order-draft";
import { Textarea } from "@/components/ui/textarea";
import { MAX_CHAT_CHARS, keepLatest } from "@/lib/ai/order-draft/to-form";
import { cn } from "@/lib/utils";

type Success = Extract<ChatDraftResponse, { ok: true }>;

/** Paste a Messenger chat, get the order form filled in. */
export function ChatPastePanel({
  defaultOpen = true,
  onDraft,
  children,
}: {
  defaultOpen?: boolean;
  onDraft: (res: Success) => void;
  /** The result view, shown under the textarea once there is one. */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function read() {
    const { text: kept, truncated } = keepLatest(text.trim());
    setError(null);
    setNote(truncated ? `Long chat: only the newest ${MAX_CHAT_CHARS.toLocaleString()} characters were read.` : null);
    startTransition(async () => {
      try {
        const res = await draftOrderFromChat(kept);
        if (res.ok) onDraft(res);
        else setError(res.message);
      } catch {
        setError("Couldn't read that chat. Fill the form as usual.");
      }
    });
  }

  return (
    <section className="border border-outline-variant/60 bg-surface-container-low">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 font-headline font-bold">
          <Sparkles className="h-4 w-4" />
          Paste a chat
          <span className="font-sans text-sm font-normal text-on-surface-variant">AI fills in the form for you</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-3 px-5 pb-5">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Paste the customer's Messenger chat here (English, Tagalog or Hiligaynon)…"
            aria-label="Customer chat"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={read}
              disabled={pending || text.trim().length < 10}
              className="inline-flex min-h-10 items-center gap-2 bg-on-surface px-4 text-sm font-semibold text-surface disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {pending ? "Reading…" : "Read chat"}
            </button>
            <span className="text-xs text-on-surface-variant">
              Replaces the items, due date and customer below. Phone numbers and emails stay on our server.
            </span>
          </div>
          {note && <p className="text-xs text-on-surface-variant">{note}</p>}
          {error && (
            <p className="text-sm font-medium text-accent-ink" role="alert">
              {error}
            </p>
          )}
          {children}
        </div>
      )}
    </section>
  );
}
