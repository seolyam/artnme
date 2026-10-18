"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { getLiveStatus } from "@/app/actions/orders";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;
const ALERTS_KEY = "artnme:web-quote-alerts";

function alertsEnabled() {
  try {
    return localStorage.getItem(ALERTS_KEY) === "on";
  } catch {
    return false;
  }
}

// The setting lives in localStorage; both sidebars (desktop + phone menu)
// subscribe so they stay in step.
const alertListeners = new Set<() => void>();
function subscribeAlerts(cb: () => void) {
  alertListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    alertListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Two short rising beeps, made on the fly so there's no sound file to load. */
function chime() {
  try {
    const Ctx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    // No audio available; the toast still shows.
  }
}

/**
 * Keeps every dashboard page current without a reload: polls a tiny status
 * probe and refreshes the page data when another staff member changes
 * something. New web quotes also get a toast and, if switched on, a chime
 * plus a browser notification while the portal is in the background.
 */
export function LiveUpdates() {
  const router = useRouter();
  const pathname = usePathname();
  const last = useRef<{ lastEvent: string | null; latestWebQuote: string | null } | null>(null);
  const stale = useRef(false);
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const refreshIfSafe = useCallback(() => {
    // Don't yank the page while someone is typing or filling in an order form.
    const typing =
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement;
    const onForm = /\/(new|edit)$/.test(pathRef.current);
    if (document.visibilityState === "visible" && !typing && !onForm) {
      stale.current = false;
      router.refresh();
    } else {
      stale.current = true;
    }
  }, [router]);

  const check = useCallback(async () => {
    let status;
    try {
      status = await getLiveStatus();
    } catch {
      return; // offline or signed out; try again next tick
    }
    const prev = last.current;
    last.current = { lastEvent: status.lastEvent, latestWebQuote: status.latestWebQuote };
    if (!prev) return;

    if (status.latestWebQuote && status.latestWebQuote !== prev.latestWebQuote) {
      toast("New web quote from the website", {
        description: `${status.webQuotes} waiting in Pending`,
        action: { label: "Open board", onClick: () => router.push("/dashboard/orders") },
        duration: 15_000,
      });
      if (alertsEnabled()) {
        chime();
        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
          new Notification("New web quote", { body: "A customer just asked for a quote.", tag: "web-quote" });
        }
      }
    }

    if (status.lastEvent !== prev.lastEvent) refreshIfSafe();
  }, [router, refreshIfSafe]);

  useEffect(() => {
    check();
    const id = setInterval(check, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (stale.current) refreshIfSafe();
      check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check, refreshIfSafe]);

  return null;
}

/** Sidebar switch for the web-quote chime and pop-up. */
export function AlertsToggle({ className }: { className?: string }) {
  const on = useSyncExternalStore(subscribeAlerts, alertsEnabled, () => false);

  async function toggle() {
    const next = !on;
    if (next && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission().catch(() => {});
    }
    try {
      localStorage.setItem(ALERTS_KEY, next ? "on" : "off");
    } catch {
      // Private mode: the setting just won't stick.
    }
    alertListeners.forEach((l) => l());
    if (next) chime();
    toast.success(next ? "You'll hear a chime for new web quotes" : "Web quote chime turned off");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 px-3.5 text-sm transition-colors",
        on ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface",
        className,
      )}
    >
      {on ? <Bell className="h-4 w-4 text-brand" /> : <BellOff className="h-4 w-4" />}
      Web quote alerts
      <span className="spec ml-auto text-[10px]">{on ? "On" : "Off"}</span>
    </button>
  );
}
