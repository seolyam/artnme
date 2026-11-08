"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { suggestStudioDesign } from "@/app/actions/ai-studio";
import { SHIRT_TEMPLATES, type ShirtTemplate } from "@/lib/customizer/templates";

export type StudioPrefill = { values: Record<string, string>; shirtColor: string; reason: string };

/** "Describe your event": the AI picks a template and fills in the words.
 *  It only opens the template form; the customer still edits and applies. */
export function DescribeShirt({ onSuggest }: { onSuggest: (template: ShirtTemplate, prefill: StudioPrefill) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const res = await suggestStudioDesign(text);
        const template = res.ok ? SHIRT_TEMPLATES.find((t) => t.id === res.templateId) : undefined;
        if (res.ok && template) onSuggest(template, { values: res.values, shirtColor: res.shirtColor, reason: res.reason });
        else setError(res.ok ? "Couldn't come up with a design just now. Pick one below." : res.message);
      } catch {
        setError("Couldn't come up with a design just now. Pick one below.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 border-2 border-dashed border-outline-variant p-4">
      <label htmlFor="describe-shirt" className="flex items-center gap-2 text-base font-semibold">
        <Sparkles aria-hidden className="h-4 w-4 text-brand" />
        Describe your event
      </label>
      <p className="text-sm text-on-surface-variant">
        e.g. &ldquo;Dela Cruz family reunion, Silay, Dec 2026, blue&rdquo;. We&apos;ll start the design for you.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="describe-shirt"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          autoComplete="off"
          className="min-h-12 flex-1 border-2 border-outline-variant bg-surface-container-lowest px-4 text-base outline-none transition-colors focus:border-brand"
        />
        <button
          type="submit"
          disabled={pending || text.trim().length < 3}
          className="flex min-h-12 items-center justify-center gap-2 bg-brand px-5 font-headline text-sm font-bold uppercase tracking-[0.12em] text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
        >
          {pending ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
          {pending ? "Designing…" : "Design it"}
        </button>
      </div>
      {error && (
        <p className="text-sm font-medium text-accent-ink" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-on-surface-variant">Uses an AI service. You can change every word before it goes on the shirt.</p>
    </form>
  );
}
