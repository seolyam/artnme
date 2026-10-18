"use client";

import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type VideoGuide = { title: string; description: string; length: string; src: string; poster: string };

/** Full-width player for the narrated how-to videos; starts playing when opened. */
export function VideoGuideDialog({
  guide,
  open,
  onOpenChange,
}: {
  guide: VideoGuide;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-none border border-white/10 bg-[#0d0d0d] p-0 text-white sm:max-w-5xl"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3.5">
          <div className="min-w-0">
            <DialogTitle className="font-headline text-base font-bold uppercase tracking-[0.08em]">
              {guide.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/60">
              {guide.description} · {guide.length}
            </DialogDescription>
          </div>
          <DialogClose className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/20 transition-colors hover:border-white">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        <video
          src={guide.src}
          poster={guide.poster}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black"
        />
      </DialogContent>
    </Dialog>
  );
}
