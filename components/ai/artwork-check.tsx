"use client";

import { useState, useTransition } from "react";
import { Loader2, ScanEye } from "lucide-react";
import { reviewOrderFile, type ArtworkReviewResponse } from "@/app/actions/ai-artwork";
import { cn } from "@/lib/utils";

const LABEL: Record<string, string> = {
  low_detail: "Low detail",
  solid_background_box: "Background box",
  screenshot_or_photo_of_screen: "Screenshot",
  watermark: "Watermark",
  photo_of_printed_item: "Photo of a print",
  thin_or_small_text: "Small text",
  near_edge: "Near edge",
  third_party_logo: "Brand logo?",
};

/** "Check artwork" on a customer file: AI flags blur, watermarks, screenshots… */
export function ArtworkCheck({ fileId }: { fileId: string }) {
  const [result, setResult] = useState<ArtworkReviewResponse | null>(null);
  const [pending, start] = useTransition();

  function check() {
    start(async () => {
      try {
        setResult(await reviewOrderFile(fileId));
      } catch {
        setResult({ ok: false, message: "Couldn't check this file right now." });
      }
    });
  }

  if (!result) {
    return (
      <button
        type="button"
        onClick={check}
        disabled={pending}
        className="inline-flex min-h-9 items-center justify-center gap-1.5 border border-outline-variant/60 text-xs font-semibold hover:border-on-surface-variant disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanEye className="h-3.5 w-3.5" />}
        {pending ? "Checking…" : "Check artwork"}
      </button>
    );
  }
  if (!result.ok) return <p className="text-xs text-accent-ink">{result.message}</p>;

  const { review } = result;
  return (
    <div className="space-y-1.5 text-xs">
      <p className={cn("font-semibold", review.printableAsIs ? "text-success" : "text-accent-ink")}>
        {review.printableAsIs ? "Looks printable" : "Needs a look"} · <span className="font-normal">{review.summary}</span>
      </p>
      {review.issues.length > 0 && (
        <ul className="flex flex-wrap gap-1">
          {review.issues.map((i, n) => (
            <li
              key={n}
              title={i.note}
              className={cn(
                "border px-1.5 py-0.5",
                i.severity === "warn" ? "border-accent-ink/50 text-accent-ink" : "border-outline-variant/60",
              )}
            >
              {LABEL[i.code] ?? i.code}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-on-surface-variant">AI check. Hover a chip for details.</p>
    </div>
  );
}
