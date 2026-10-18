"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import { VideoGuideDialog } from "@/components/video-guide-dialog";
import { cn } from "@/lib/utils";

/**
 * The narrated "how to use the 3D Studio" video for customers. Recorded with
 * scripts/demo-video/studio and served from /public/videos.
 */
export const STUDIO_GUIDE = {
  title: "How to use the 3D Studio",
  description: "Pick a color, add your design, and send it to us",
  src: "/videos/3d-studio-guide.mp4",
  poster: "/videos/3d-studio-guide.jpg",
  length: "4 min",
};

/** Remembers that the customer has seen (or waved away) the first-visit prompt. */
const SEEN_KEY = "studio_guide_seen";

function StudioGuideDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <VideoGuideDialog guide={STUDIO_GUIDE} open={open} onOpenChange={onOpenChange} />;
}

/** "Watch how it works" button for pages that link to the studio. */
export function StudioGuideButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex min-h-15 items-center gap-3 border border-outline-variant px-7 font-headline text-[15px] font-bold uppercase tracking-[0.14em] transition-colors hover:border-on-surface hover:bg-surface-container-high",
          className,
        )}
      >
        <Play aria-hidden className="h-4.5 w-4.5 fill-current" />
        Watch how it works
        <span className="spec text-[11px] text-on-surface-variant">{STUDIO_GUIDE.length}</span>
      </button>
      <StudioGuideDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/**
 * Sits on the studio stage. First-time visitors with an empty shirt get a card
 * offering the guide; once watched or dismissed it shrinks to a small button.
 * Only mounted after the studio's hydration gate, so reading localStorage on
 * first render can't cause a hydration mismatch.
 */
export function StudioGuidePrompt({ hasDesign }: { hasDesign: boolean }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => {
    try {
      return window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return false;
    }
  });

  const markSeen = () => {
    setSeen(true);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Private mode or blocked storage: the card just shows again next visit.
    }
  };

  const watch = () => {
    markSeen();
    setOpen(true);
  };

  return (
    <div data-studio-guide className="absolute bottom-12 left-4 z-20 max-w-[calc(100%-2rem)]">
      {seen || hasDesign ? (
        <button
          type="button"
          onClick={watch}
          className="flex min-h-10 items-center gap-2 border border-outline-variant/40 bg-surface-container-lowest/85 px-3.5 font-headline text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface backdrop-blur-md transition-colors hover:border-brand hover:text-brand"
        >
          <Play aria-hidden className="h-3.5 w-3.5 fill-current" />
          How it works
        </button>
      ) : (
        // One slim row on phones, where the stage is short; a card with a thumbnail from sm up.
        <div className="flex items-center gap-3 border border-outline-variant/40 bg-surface-container-lowest/90 p-2 pr-1 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md sm:gap-4 sm:p-3 sm:pr-2">
          <button
            type="button"
            onClick={watch}
            aria-label="Watch the 3D Studio guide"
            className="group relative hidden h-[63px] w-28 shrink-0 overflow-hidden bg-black sm:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={STUDIO_GUIDE.poster} alt="" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-8 w-8 items-center justify-center bg-brand text-white">
                <Play aria-hidden className="h-4 w-4 fill-current" />
              </span>
            </span>
          </button>
          <div className="flex min-w-0 items-center gap-3 sm:block">
            <div className="min-w-0">
              <p className="font-headline text-xs font-bold uppercase leading-tight text-on-surface sm:text-sm">
                New to the 3D Studio?
              </p>
              <p className="mt-0.5 hidden text-xs text-on-surface-variant sm:block">
                Watch a short guide · {STUDIO_GUIDE.length}
              </p>
            </div>
            <button
              type="button"
              onClick={watch}
              className="flex min-h-9 shrink-0 items-center gap-2 bg-brand px-3.5 font-headline text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-[filter] hover:brightness-110 sm:mt-2"
            >
              <Play aria-hidden className="h-3.5 w-3.5 fill-current" />
              Watch the guide
            </button>
          </div>
          <button
            type="button"
            onClick={markSeen}
            aria-label="Hide the guide prompt"
            className="flex h-9 w-9 shrink-0 items-center justify-center text-on-surface-variant transition-colors hover:text-on-surface sm:self-start"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <StudioGuideDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
