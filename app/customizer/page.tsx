"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CustomizerProvider, useCustomizer } from "@/components/customizer/CustomizerProvider";
import { Scene, type ViewSide } from "@/components/customizer/Scene";
import { SwatchChip } from "@/components/customizer/SwatchChip";
import { FileDropZone } from "@/components/customizer/FileDropZone";
import { LayerList } from "@/components/customizer/LayerList";
import { LayerEditor } from "@/components/customizer/LayerEditor";
import { TextAdder } from "@/components/customizer/TextAdder";
import { PRINT_COLORS } from "@/components/customizer/SwatchChip";
import { exportMultiViewPng } from "@/lib/customizer/export";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

function ConfigPanel() {
  const { shirtColor, setShirtColor, assets, addImageAssets, clearDraft, threeRef } =
    useCustomizer();
  const [exporting, setExporting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

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

  return (
    <aside className="flex h-full flex-col bg-surface-container-low">
      {/* Wizard Header */}
      <header className="border-b border-outline-variant/20 bg-surface-container-low px-8 py-6 lg:px-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline text-2xl font-black uppercase leading-none tracking-tighter text-on-surface">
              Design<span className="text-primary-container">Wizard</span>
            </h2>
          </div>
          {(assets.length > 0 || shirtColor !== "#FFFFFF") && (
            <button
              type="button"
              onClick={handleStartOver}
              title="Clear saved draft and start over"
              className="flex shrink-0 items-center gap-1 bg-[#E31E24] px-4 py-2 font-headline text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-error/90 active:scale-95 shadow-md"
            >
              <span className="material-symbols-outlined text-base">
                restart_alt
              </span>
              Start Over
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          {[
            { id: 1, label: "1. Color" },
            { id: 2, label: "2. Design" },
            { id: 3, label: "3. Review" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setStep(t.id as 1 | 2 | 3)}
              className={cn(
                "flex-1 py-3 text-center font-headline text-[10px] font-bold uppercase tracking-widest transition-all",
                step === t.id
                  ? "bg-primary-container text-on-primary-container shadow-sm border-b-2 border-[#E31E24]"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Wizard Body */}
      <div className="flex-1 overflow-y-auto px-8 py-8 lg:px-10">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="mb-6 font-headline text-lg font-black uppercase tracking-wide text-on-surface">
              Choose a Base Color
            </h3>
            <p className="mb-8 text-sm text-on-surface-variant">
              Select the starting color for your T-Shirt. We offer high-quality blanks in these standard colors.
            </p>
            <section className="mb-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
                  Active Color
                </span>
                <span className="font-headline text-xs uppercase tracking-widest text-on-surface-variant">
                  {activeColor?.name ?? "Custom"}
                </span>
              </div>
              <SwatchChip selected={shirtColor} onSelect={setShirtColor} />
            </section>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-primary-container py-5 font-headline text-sm font-black uppercase tracking-widest text-on-primary-container hover:brightness-110 active:scale-95 transition-all"
            >
              Next: Add Design
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="mb-6 font-headline text-lg font-black uppercase tracking-wide text-on-surface">
              Add Your Design
            </h3>
            <p className="mb-8 text-sm text-on-surface-variant">
              Upload a logo or type custom text. Once added, click the design on the shirt to position it.
            </p>
            
            <section className="mb-8 space-y-4">
              <h4 className="font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
                Upload Image
              </h4>
              <FileDropZone onFilesSelected={addImageAssets} />
            </section>

            <section className="mb-8 space-y-4 border-t border-outline-variant/20 pt-8">
              <h4 className="font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
                Add Text
              </h4>
              <TextAdder />
            </section>

            <section className="mb-8 space-y-4 border-t border-outline-variant/20 pt-8">
              <h4 className="font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
                Placement & Layers
              </h4>
              <LayerEditor />
            </section>

            <section className="mb-10 space-y-4 border-t border-outline-variant/20 pt-8">
              <div className="flex items-center justify-between">
                <h4 className="font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
                  Your Layers
                </h4>
                <span className="font-headline text-xs uppercase tracking-widest text-on-surface-variant">
                  {assets.length} {assets.length === 1 ? "item" : "items"}
                </span>
              </div>
              <LayerList />
            </section>

            <button
              onClick={() => setStep(3)}
              className="w-full bg-primary-container py-5 font-headline text-sm font-black uppercase tracking-widest text-on-primary-container hover:brightness-110 active:scale-95 transition-all"
            >
              Next: Review & Export
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="mb-6 font-headline text-lg font-black uppercase tracking-wide text-on-surface">
              Review & Export
            </h3>
            <p className="mb-8 text-sm text-on-surface-variant">
              Drag to spin the 3D shirt and make sure everything looks perfect. Once you&apos;re ready, download your mockup.
            </p>
            <div className="mb-8 rounded-lg border-2 border-dashed border-primary-container/30 bg-surface-container p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-primary-container/50 mb-2">
                360
              </span>
              <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                Take a full look around!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Footer for Step 3 */}
      {step === 3 && (
        <div className="border-t border-outline-variant/20 bg-surface-container-lowest p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-4">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="group relative w-full overflow-hidden bg-primary-container py-6 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg"
          >
            <span className="relative z-10 font-headline text-xl font-black uppercase tracking-widest text-on-primary-container transition-all">
              {exporting ? "Exporting..." : "Download Mockup"}
            </span>
            <span className="absolute inset-0 translate-y-full bg-white mix-blend-overlay transition-transform duration-300 group-hover:translate-y-0" />
          </button>
          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-on-surface-variant opacity-70">
            Downloads a single PNG image showing all four sides of your design.
          </p>
        </div>
      )}
    </aside>
  );
}

function CustomizerStage() {
  const [viewSide, setViewSide] = useState<ViewSide>("front");

  return (
    <div className="relative h-full w-full bg-surface-container-lowest">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-60">
        <div className="absolute -top-10 left-1/4 h-72 w-72 bg-primary-container/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 bg-primary/10 blur-[120px]" />
      </div>
      <div className="relative z-10 h-full w-full">
        <Scene viewSide={viewSide} />
      </div>

      {/* Stage toolbar */}
      <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1 border border-outline-variant/20 bg-surface-container-lowest/80 p-1 backdrop-blur-md">
        <StageToggle
          active={viewSide === "front"}
          onClick={() => setViewSide("front")}
          icon="south"
          label="View Front"
        />
        <StageToggle
          active={viewSide === "back"}
          onClick={() => setViewSide("back")}
          icon="north"
          label="View Back"
        />
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-center">
        <p className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant opacity-60">
          Drag to spin 360° — Scroll to zoom — Click a print to edit it
        </p>
      </div>
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
      className={cn(
        "flex items-center gap-2 px-4 py-2 font-headline text-[11px] font-bold uppercase tracking-widest transition-colors",
        active
          ? "bg-surface-container-high text-primary-container"
          : "text-on-surface-variant hover:text-primary-container",
      )}
      title={label}
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
      {label.replace("View ", "")}
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
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary-container">
              progress_activity
            </span>
            <p className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant opacity-60">
              Restoring your design…
            </p>
          </div>
        </div>
      ) : (
        <main className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background lg:flex-row">
          <header className="absolute left-0 top-0 z-30 flex w-full items-center justify-between px-6 py-5 lg:px-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-on-surface transition-colors hover:text-primary-container"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
              <span className="font-headline text-sm font-bold uppercase tracking-widest">
                Art&apos;n Me
              </span>
            </Link>
            <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant opacity-60">
              Live 3D Preview
            </span>
          </header>

          <section className="h-[45vh] w-full shrink-0 pt-16 lg:h-full lg:w-[62%] lg:pt-0">
            <CustomizerStage />
          </section>

          <section className="h-[55vh] w-full lg:h-full lg:w-[38%]">
            <ConfigPanel />
          </section>
        </main>
      )}
    </>
  );
}
