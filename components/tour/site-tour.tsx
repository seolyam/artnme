"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CircleHelp, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { TOUR_STEPS, holeFor, nextAfterNavigation, placeCard, type Rect } from "@/lib/tour";

/** Set once the first-visit welcome has been shown, however it was closed. */
const OFFERED_KEY = "artnme_tour_offered";
/** Pages where a first-time popup would get in the way (customers arriving from an emailed tracking link). */
const NO_AUTO_OFFER = ["/track/"];

/**
 * Help for first-time (and not very techy) customers, mounted once in the
 * public layout so it survives page changes:
 * - a welcome popup on the first visit offering a step-by-step guide,
 * - a Help button that brings the same offer back any time,
 * - the guide itself: the page is dimmed and one thing at a time is lit up
 *   with a large-print card saying what to do.
 */
export function SiteTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);
  const [step, setStep] = useState<number | null>(null);

  // Offer the guide once, after the page has settled. localStorage is only
  // readable in the browser, so this runs after hydration.
  useEffect(() => {
    if (NO_AUTO_OFFER.some((p) => window.location.pathname.startsWith(p))) return;
    let offered = false;
    try {
      offered = window.localStorage.getItem(OFFERED_KEY) === "1";
    } catch {
      // Blocked storage: treat as offered so the popup doesn't nag on every page.
      offered = true;
    }
    if (offered) return;
    const t = window.setTimeout(() => {
      setFirstVisit(true);
      setHelpOpen(true);
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);

  const onHelpOpenChange = (open: boolean) => {
    setHelpOpen(open);
    if (!open && firstVisit) {
      setFirstVisit(false);
      try {
        window.localStorage.setItem(OFFERED_KEY, "1");
      } catch {
        // Nothing to remember it in; the popup may show again next visit.
      }
    }
  };

  // Follow page changes made while the tour is open (same pattern as Navbar's menu).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (step !== null) setStep(nextAfterNavigation(step, pathname));
  }

  // Take the customer to the page the current step is on.
  const stepPath = step === null ? null : TOUR_STEPS[step].path;
  useEffect(() => {
    if (stepPath && stepPath !== pathname) router.push(stepPath);
  }, [stepPath, pathname, router]);

  const startTour = () => {
    onHelpOpenChange(false);
    setStep(0);
  };

  return (
    <>
      <button
        type="button"
        data-tour="help-button"
        onClick={() => setHelpOpen(true)}
        className="fixed bottom-4 right-4 z-30 flex min-h-14 items-center gap-2.5 border border-white/20 bg-[#161514] px-5 font-headline text-base font-bold uppercase tracking-[0.08em] text-white shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-colors hover:bg-brand md:bottom-6 md:right-6"
      >
        <CircleHelp aria-hidden className="h-6 w-6" />
        Help
      </button>

      <HelpDialog
        open={helpOpen}
        onOpenChange={onHelpOpenChange}
        firstVisit={firstVisit}
        onStartTour={startTour}
      />

      {step !== null && (
        <TourOverlay
          step={step}
          onStep={setStep}
          onClose={() => setStep(null)}
          onPage={pathname === TOUR_STEPS[step].path}
        />
      )}
    </>
  );
}

function HelpDialog({
  open,
  onOpenChange,
  firstVisit,
  onStartTour,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstVisit: boolean;
  onStartTour: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-none border border-outline-variant bg-surface p-0 text-on-surface sm:max-w-md"
      >
        <div className="px-6 pt-7">
          <DialogTitle className="font-headline text-2xl font-bold uppercase tracking-tight">
            {firstVisit ? "Welcome to Art 'n Me!" : "Need help?"}
          </DialogTitle>
          <DialogDescription className="mt-3 text-lg leading-snug text-on-surface-variant">
            {firstVisit
              ? "First time here? We can show you how to order, one step at a time. It takes about a minute."
              : "We can show you how to order, one step at a time."}
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-3 px-6 pb-6 pt-6">
          <button
            type="button"
            onClick={onStartTour}
            className="flex min-h-16 w-full items-center justify-between gap-4 bg-brand px-6 text-left font-headline text-xl font-bold uppercase tracking-[0.04em] text-white transition-[filter] hover:brightness-110"
          >
            Yes, show me how
            <ArrowRight aria-hidden className="h-6 w-6 shrink-0" />
          </button>
          <DialogClose className="flex min-h-14 w-full items-center justify-center border-2 border-outline-variant px-6 text-lg font-semibold transition-colors hover:border-on-surface hover:bg-surface-container-high">
            No thanks, I&apos;ll look around
          </DialogClose>
          {firstVisit && (
            <p className="pt-2 text-center text-base text-on-surface-variant">
              You can open this again with the <strong className="text-on-surface">Help</strong> button at the bottom
              of the screen.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (!!a &&
    !!b &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5);

/** First `data-tour` element that is actually on screen (desktop and phone layouts hide different ones). */
function findTarget(names: string[]) {
  for (const name of names) {
    for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

function TourOverlay({
  step,
  onStep,
  onClose,
  onPage,
}: {
  step: number;
  onStep: (step: number) => void;
  onClose: () => void;
  onPage: boolean;
}) {
  const current = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;
  const [target, setTarget] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [cardHeight, setCardHeight] = useState(0);
  // Hide the card for a moment while a new page loads, instead of flashing it in the middle.
  const [waiting, setWaiting] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Track the target every frame: smooth scrolling, entrance animations and
  // form messages all move things around, and the spotlight has to follow.
  useEffect(() => {
    let frame = 0;
    let scrolled = false;
    const startedAt = performance.now();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (onPage && current.scrollTop) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      scrolled = true;
    }

    const tick = () => {
      const el = onPage ? findTarget(current.targets) : null;
      let rect: Rect | null = null;
      if (el) {
        const r = el.getBoundingClientRect();
        rect = { top: r.top, left: r.left, width: r.width, height: r.height };
        if (!scrolled) {
          scrolled = true;
          // Park the target near the top (clear of the navbar) so the card fits underneath.
          const top = window.scrollY + r.top - Math.min(110, window.innerHeight * 0.15);
          window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
        }
      }
      setTarget((prev) => (sameRect(prev, rect) ? prev : rect));
      setViewport((prev) =>
        prev.width === window.innerWidth && prev.height === window.innerHeight
          ? prev
          : { width: window.innerWidth, height: window.innerHeight },
      );
      const h = cardRef.current?.offsetHeight ?? 0;
      setCardHeight((prev) => (prev === h ? prev : h));
      setWaiting(!el && performance.now() - startedAt < 1500);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [current, onPage]);

  useEffect(() => {
    if (!waiting) nextRef.current?.focus({ preventScroll: true });
  }, [step, waiting]);

  const next = useCallback(() => (last ? onClose() : onStep(step + 1)), [last, onClose, onStep, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!viewport.width) return null;

  const hole = target ? holeFor(target, viewport) : null;
  const cardWidth = Math.min(420, viewport.width - 32);
  const pos = placeCard(hole, { width: cardWidth, height: cardHeight }, viewport);
  const { width: W, height: H } = viewport;
  // Whole screen minus the hole; with even-odd filling the hole stays clear
  // and clicks inside it reach the page underneath.
  const shade = hole
    ? `M0 0H${W}V${H}H0Z M${hole.left} ${hole.top}h${hole.width}v${hole.height}h${-hole.width}Z`
    : `M0 0H${W}V${H}H0Z`;

  return (
    <div className="fixed inset-0 z-[70]" style={{ pointerEvents: "none" }}>
      <svg aria-hidden width={W} height={H} className="absolute inset-0">
        <path d={shade} fillRule="evenodd" fill="rgba(0,0,0,0.72)" style={{ pointerEvents: "auto" }} />
      </svg>

      {hole && (
        <>
          <motion.div
            aria-hidden
            className="absolute border-[3px] border-brand"
            style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
            animate={{ boxShadow: ["0 0 0 0 rgba(227,30,36,0.7)", "0 0 0 10px rgba(227,30,36,0)"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
          {!current.interactive && (
            // Look, don't touch: this step only explains.
            <div
              aria-hidden
              className="absolute"
              style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height, pointerEvents: "auto" }}
            />
          )}
        </>
      )}

      {!waiting && (
        <motion.div
          key={step}
          ref={cardRef}
          role="dialog"
          aria-labelledby="tour-title"
          aria-describedby="tour-body"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute border-2 border-on-surface bg-surface text-on-surface shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
          style={{
            top: pos.top,
            left: pos.left,
            width: cardWidth,
            pointerEvents: "auto",
            // Measured on the first frame, placed on the next.
            visibility: cardHeight ? "visible" : "hidden",
          }}
        >
          <div className="h-1.5 bg-outline-variant/40">
            <div className="h-full bg-brand" style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }} />
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-on-surface-variant">
                Step {step + 1} of {TOUR_STEPS.length}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 flex min-h-11 items-center gap-1.5 px-2 text-base text-on-surface-variant underline underline-offset-4 hover:text-on-surface"
              >
                <X aria-hidden className="h-4 w-4" />
                Close guide
              </button>
            </div>
            <h2 id="tour-title" className="mt-2 font-headline text-2xl font-bold leading-tight">
              {current.title}
            </h2>
            <p id="tour-body" className="mt-2 text-lg leading-relaxed">
              {current.body}
            </p>
            <div className="mt-5 flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => onStep(step - 1)}
                  className="flex min-h-14 items-center gap-2 border-2 border-outline-variant px-4 text-lg font-semibold transition-colors hover:border-on-surface"
                >
                  <ArrowLeft aria-hidden className="h-5 w-5" />
                  Back
                </button>
              )}
              <button
                ref={nextRef}
                type="button"
                onClick={next}
                className="flex min-h-14 flex-1 items-center justify-center gap-2 bg-brand px-5 font-headline text-xl font-bold uppercase tracking-[0.04em] text-white transition-[filter] hover:brightness-110"
              >
                {last ? "Finish" : "Next"}
                {!last && <ArrowRight aria-hidden className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
