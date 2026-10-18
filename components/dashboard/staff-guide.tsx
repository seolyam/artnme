"use client";

import { useEffect, useState } from "react";
import { CirclePlay } from "lucide-react";
import { VideoGuideDialog } from "@/components/video-guide-dialog";

export const OPEN_STAFF_GUIDE_EVENT = "open-staff-guide";

/**
 * The narrated staff portal walkthrough. Recorded with scripts/demo-video/staff
 * and served to signed-in staff from app/api/staff-guide.
 */
const STAFF_GUIDE = {
  title: "How to use the staff portal",
  description: "One order from walk-in to pickup, then search, customers, prices and reports",
  length: "6 min",
  src: "/api/staff-guide/staff-portal-guide.mp4",
  poster: "/api/staff-guide/staff-portal-guide.jpg",
};

/**
 * Mounted once in the dashboard layout, like the command palette, so the
 * mobile menu can close without taking the player down with it.
 */
export function StaffGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_STAFF_GUIDE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_STAFF_GUIDE_EVENT, onOpen);
  }, []);

  return <VideoGuideDialog guide={STAFF_GUIDE} open={open} onOpenChange={setOpen} />;
}

export function StaffGuideButton({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        window.dispatchEvent(new Event(OPEN_STAFF_GUIDE_EVENT));
      }}
      className="flex min-h-11 w-full items-center gap-3 px-3.5 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
    >
      <CirclePlay className="h-4 w-4" />
      Video guide
      <span className="spec ml-auto text-[10px]">{STAFF_GUIDE.length}</span>
    </button>
  );
}
