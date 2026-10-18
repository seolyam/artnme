"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { CustomizerProvider, useCustomizer } from "@/components/customizer/CustomizerProvider";
import { Scene, type ViewSide } from "@/components/customizer/Scene";
import { SwatchChip } from "@/components/customizer/SwatchChip";
import { FileDropZone } from "@/components/customizer/FileDropZone";
import { LayerList } from "@/components/customizer/LayerList";
import { LayerEditor } from "@/components/customizer/LayerEditor";
import { TextAdder } from "@/components/customizer/TextAdder";
import { StudioGuidePrompt } from "@/components/customizer/StudioGuide";
import { PRINT_COLORS } from "@/components/customizer/SwatchChip";
import { exportMultiViewPng } from "@/lib/customizer/export";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { EASE_PRESS } from "@/components/motion/reveal";
import { ArrowRight, RegistrationMark } from "@/components/motion/icons";

const STEPS = [
  { id: 1, label: "Color" },
  { id: 2, label: "Design" },
  { id: 3, label: "Review" },
] as const;

type Step = (typeof STEPS)[number]["id"];

const stepMotion = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.35, ease: EASE_PRESS },
};

const primaryButton =
  "ink-fill flex w-full min-h-15 items-center justify-center gap-3 bg-brand font-headline text-sm font-bold uppercase tracking-[0.16em] text-white";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="spec text-accent-ink">{children}</h4>;
}

function ConfigPanel() {
  const { shirtColor, setShirtColor, assets, addImageAssets, clearDraft, threeRef } =
    useCustomizer();
  const [exporting, setExporting] = useState(false);
  const [step, setStep] = useState<Step>(1);

  const activeColor =
    PRINT_COLORS.find((c) => c.hex.toLowerCase() === shirtColor.toLowerCase()) ??
    null;

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const ok = await exportMultiViewPng(
        threeRef.current,
        "artnme-shirt-design.png",
      );
      if (ok) {
        toast.success("Design exported — 4-angle mockup downloaded.");
      } else {
        toast.error("Could not export — try again once the preview finishes loading.");
      }
    } catch {
      toast.error("Export failed unexpectedly.");
    } finally {
      setExporting(false);
    }
  };

  const handleStartOver = () => {
    if (confirm("Are you sure you want to start over? This will clear your design.")) {
      clearDraft();
      setStep(1);
      toast.success("Draft cleared — starting fresh.");
    }
  };

  const placements = Array.from(new Set(assets.map((a) => a.placement)));

  return (
    <aside aria-label="Design wizard" className="flex h-full flex-col bg-surface-container-low">
      <header className="border-b border-outline-variant/30 px-6 pt-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline text-2xl font-bold uppercase leading-none tracking-tight text-on-surface">
            Design <span className="text-brand">wizard</span>
          </h2>
          {(assets.length > 0 || shirtColor !== "#FFFFFF") && (
            <button
              type="button"
              onClick={handleStartOver}
              title="Clear saved draft and start over"
              className="flex min-h-10 shrink-0 items-center gap-1.5 border border-outline-variant/60 px-3.5 font-headline text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant transition-colors hover:border-brand hover:text-brand"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              Start over
            </button>
          )}
        </div>

        <ol className="mt-6 grid grid-cols-3 gap-1">
          {STEPS.map((t) => {
            const active = step === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setStep(t.id)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "relative flex min-h-14 w-full flex-col items-start justify-center gap-0.5 px-3 text-left transition-colors",
                    active
                      ? "bg-surface-container-high"
                      : "bg-surface-container hover:bg-surface-container-high",
                  )}
                >
                  <span className="spec text-[10px] text-on-surface-variant">0{t.id}</span>
                  <span className="font-headline text-xs font-bold uppercase tracking-[0.12em] text-on-surface">
                    {t.label}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="wizard-step"
                      className="absolute inset-x-0 bottom-0 h-[3px] bg-brand"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-8 lg:px-8">
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 && (
            <motion.div key="step-1" {...stepMotion}>
              <h3 className="mb-2 font-headline text-xl font-bold uppercase text-on-surface">
                Pick a blank
              </h3>
              <p className="mb-8 text-sm text-on-surface-variant">
                Premium cotton blanks in our stock colors.
              </p>
              <section className="mb-10 space-y-4">
                <div className="flex items-center justify-between">
                  <SectionLabel>Active color</SectionLabel>
                  <span className="spec text-on-surface-variant">
                    {activeColor?.name ?? "Custom"}
                  </span>
                </div>
                <SwatchChip selected={shirtColor} onSelect={setShirtColor} />
              </section>
              <button type="button" onClick={() => setStep(2)} className={primaryButton}>
                Next: add your design
                <ArrowRight className="ink-arrow" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" {...stepMotion}>
              <h3 className="mb-2 font-headline text-xl font-bold uppercase text-on-surface">
                Add your design
              </h3>
              <p className="mb-8 text-sm text-on-surface-variant">
                Upload a logo or type custom text. Once added, click the print on
                the shirt to position it.
              </p>

              <section className="mb-8 space-y-4">
                <SectionLabel>Upload artwork</SectionLabel>
                <FileDropZone onFilesSelected={addImageAssets} />
              </section>

              <section className="mb-8 space-y-4 border-t border-outline-variant/30 pt-8">
                <SectionLabel>Add text</SectionLabel>
                <TextAdder />
              </section>

              <section className="mb-8 space-y-4 border-t border-outline-variant/30 pt-8">
                <SectionLabel>Placement &amp; layers</SectionLabel>
                <LayerEditor />
              </section>

              <section className="mb-10 space-y-4 border-t border-outline-variant/30 pt-8">
                <div className="flex items-center justify-between">
                  <SectionLabel>Your layers</SectionLabel>
                  <span className="spec text-on-surface-variant">
                    {String(assets.length).padStart(2, "0")}{" "}
                    {assets.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <LayerList />
              </section>

              <button type="button" onClick={() => setStep(3)} className={primaryButton}>
                Next: review &amp; export
                <ArrowRight className="ink-arrow" />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step-3" {...stepMotion}>
              <h3 className="mb-2 font-headline text-xl font-bold uppercase text-on-surface">
                Review &amp; send
              </h3>
              <p className="mb-8 text-sm text-on-surface-variant">
                Spin the shirt to check every side. Download the mockup, then send
                it to us for a quote.
              </p>
              <dl className="mb-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border border-outline-variant/40 bg-surface-container-lowest p-5 text-sm">
                <dt className="spec text-[11px] text-on-surface-variant">Blank</dt>
                <dd>{activeColor?.name ?? "Custom"} cotton tee</dd>
                <dt className="spec text-[11px] text-on-surface-variant">Prints</dt>
                <dd>
                  {assets.length} {assets.length === 1 ? "layer" : "layers"}
                  {placements.length > 0 && ` · ${placements.join(" + ")}`}
                </dd>
              </dl>
              <div className="flex items-center gap-4 border-2 border-dashed border-outline-variant/50 p-5">
                <span className="material-symbols-outlined text-3xl text-brand">360</span>
                <p className="text-sm text-on-surface-variant">
                  Drag the shirt to look around before you export.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4, ease: EASE_PRESS }}
            className="space-y-3 border-t border-outline-variant/30 bg-surface-container-lowest p-6 lg:p-8"
          >
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="flex min-h-14 w-full items-center justify-center gap-3 border border-outline-variant font-headline text-sm font-bold uppercase tracking-[0.16em] text-on-surface transition-colors hover:border-on-surface hover:bg-surface-container-high disabled:cursor-wait disabled:opacity-60"
            >
              <span className={cn("material-symbols-outlined text-xl", exporting && "animate-spin")}>
                {exporting ? "progress_activity" : "download"}
              </span>
              {exporting ? "Exporting…" : "Download 4-angle mockup"}
            </button>
            <Link href="/quote?product=T-Shirt&from=studio" className={primaryButton}>
              Send to quote
              <ArrowRight className="ink-arrow" />
            </Link>
            <p className="spec pt-1 text-center text-[10px] text-on-surface-variant">
              Download first, then attach the PNG to your quote
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

function CustomizerStage() {
  const { assets } = useCustomizer();
  const [viewSide, setViewSide] = useState<ViewSide>("front");

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-container-lowest">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--surface-low)_1px,transparent_1px),linear-gradient(90deg,var(--surface-low)_1px,transparent_1px)] [background-size:48px_48px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[55%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(227,30,36,0.2),transparent_65%)]"
      />
      <motion.div
        className="relative z-10 h-full w-full"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE_PRESS }}
      >
        <Scene viewSide={viewSide} />
      </motion.div>

      <div
        role="group"
        aria-label="Camera"
        className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 border border-outline-variant/40 bg-surface-container-lowest/85 p-1 backdrop-blur-md"
      >
        <StageToggle active={viewSide === "front"} onClick={() => setViewSide("front")} icon="south" label="Front" />
        <StageToggle active={viewSide === "back"} onClick={() => setViewSide("back")} icon="north" label="Back" />
      </div>

      <p className="spec pointer-events-none absolute bottom-4 left-1/2 z-20 w-full -translate-x-1/2 px-4 text-center text-[10px] text-on-surface-variant">
        Drag to spin 360° · Scroll to zoom · Click a print to edit it
      </p>

      <StudioGuidePrompt hasDesign={assets.length > 0} />
    </div>
  );
}

function StageToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={`View ${label.toLowerCase()}`}
      className={cn(
        "relative flex min-h-10 items-center gap-2 px-4 font-headline text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
        active ? "text-accent-ink" : "text-on-surface-variant hover:text-on-surface",
      )}
    >
      {active && (
        <motion.span
          layoutId="stage-toggle"
          className="absolute inset-0 bg-surface-container-high"
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        />
      )}
      <span className="material-symbols-outlined relative text-base">{icon}</span>
      <span className="relative">{label}</span>
    </button>
  );
}

export default function CustomizerPage() {
  return (
    <CustomizerProvider>
      <CustomizerShell />
    </CustomizerProvider>
  );
}

/**
 * Lives inside the CustomizerProvider so it can read `hydrated`/`draftRestored`
 * and gate the full UI behind hydration to avoid Next.js SSR hydration
 * mismatches (the saved draft only exists on the client).
 */
function CustomizerShell() {
  const { hydrated, draftRestored } = useCustomizer();

  // Fire the "draft restored" notice exactly once, after hydration, only on the
  // client. Runs after Toaster is mounted so the toast actually appears.
  useEffect(() => {
    if (hydrated && draftRestored) {
      toast.success("Draft restored — your design is back.");
    }
  }, [hydrated, draftRestored]);

  // SSR-safe hydration gate: this placeholder is identical on the server and
  // the first client render (hydrated === false on both), so there is no
  // hydration mismatch. The restored draft only swaps in once we've read
  // localStorage on the client.
  return (
    <>
      <Toaster richColors />
      {!hydrated ? (
        <div className="flex h-[100dvh] w-full items-center justify-center bg-surface-container-lowest">
          <div className="flex flex-col items-center gap-4 text-center">
            <RegistrationMark className="h-14 w-14 animate-spin text-on-surface" />
            <p className="spec text-[10px] text-on-surface-variant">Restoring your design…</p>
          </div>
        </div>
      ) : (
        <main className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background lg:flex-row">
          {/* Overlaps the stage's Front/Back toggle on desktop, so only the
              link itself takes clicks. */}
          <header className="pointer-events-none absolute left-0 top-0 z-30 flex w-full items-center justify-between px-4 py-4 lg:w-[62%] lg:px-6">
            <Link
              href="/"
              className="pointer-events-auto flex min-h-11 items-center gap-3 text-on-surface transition-colors hover:text-brand"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              <img src="/images/art-n-me-logo.jpg" alt="" className="h-8 w-8 object-cover" />
              <span className="font-headline text-sm font-bold uppercase tracking-[0.08em]">
                Art &apos;n Me
              </span>
            </Link>
            <span className="spec hidden items-center gap-2 text-[10px] text-on-surface-variant sm:flex">
              <span className="h-2 w-2 bg-success" />
              Draft autosaved
            </span>
          </header>

          <section className="h-[45vh] w-full shrink-0 pt-16 lg:h-full lg:w-[62%] lg:pt-0">
            <CustomizerStage />
          </section>

          <motion.section
            className="h-[55vh] w-full lg:h-full lg:w-[38%] lg:border-l lg:border-outline-variant/30"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE_PRESS }}
          >
            <ConfigPanel />
          </motion.section>
        </main>
      )}
    </>
  );
}
