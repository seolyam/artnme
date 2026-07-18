"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CustomizerProvider, useCustomizer } from "@/components/customizer/CustomizerProvider";
import { Scene, type ViewSide } from "@/components/customizer/Scene";
import { SwatchChip } from "@/components/customizer/SwatchChip";
import { FileDropZone } from "@/components/customizer/FileDropZone";
import { LayerList } from "@/components/customizer/LayerList";
import { LayerEditor } from "@/components/customizer/LayerEditor";
import { TextAdder } from "@/components/customizer/TextAdder";
import { PRINT_COLORS } from "@/components/customizer/SwatchChip";
import { exportCanvasToPng } from "@/lib/customizer/export";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

function ConfigPanel() {
  const { shirtColor, setShirtColor, assets, addImageAssets, clearDraft } =
    useCustomizer();
  const [submitting, setSubmitting] = useState(false);

  const activeColor =
    PRINT_COLORS.find((c) => c.hex.toLowerCase() === shirtColor.toLowerCase()) ??
    null;

  const handleSubmit = () => {
    setSubmitting(true);
    const payload = {
      shirtColor,
      colorName: activeColor?.name ?? "Custom",
      assets: assets.map((asset) => ({
        id: asset.id,
        kind: asset.kind,
        fileName: asset.fileName,
        text: asset.text ?? null,
        textColor: asset.textColor ?? null,
        placement: asset.placement,
        flipped: asset.flipped,
        position: asset.position,
        rotation: asset.rotation,
        scale: asset.scale,
        visible: asset.visible,
      })),
      submittedAt: new Date().toISOString(),
    };
    console.log("[Customizer] Send Design to Shop:", payload);
    window.setTimeout(() => setSubmitting(false), 900);
  };

  return (
    <aside className="flex h-full flex-col bg-surface-container-low">
      <div className="flex-1 overflow-y-auto px-8 py-10 lg:px-10">
        <header className="mb-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-primary-container font-headline font-bold uppercase tracking-[0.3em] text-xs">
                3D Configurator
              </span>
              <h2 className="mt-3 font-headline text-3xl font-black uppercase leading-none tracking-tighter text-on-surface dark:text-white">
                Design<br />
                <span className="text-primary-container">Your Shirt.</span>
              </h2>
            </div>
            {(assets.length > 0 || shirtColor !== "#FFFFFF") && (
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  toast.success("Draft cleared — starting fresh.");
                }}
                title="Clear saved draft and start over"
                className="flex shrink-0 items-center gap-1 border border-outline-variant/30 bg-surface-container-high px-3 py-2 font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:border-error hover:text-error"
              >
                <span className="material-symbols-outlined text-base">
                  restart_alt
                </span>
                Clear
              </button>
            )}
          </div>
          <p className="mt-4 text-sm font-light leading-relaxed text-on-surface-variant">
            Spin the shirt a full 360°, pick a base color, then add image and
            text layers. Select a print on the shirt or in the list, then use
            these controls to nudge, rotate, flip, resize, or send it to the
            back. Your work auto-saves locally as you go.
          </p>
        </header>

        <section className="mb-10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
              Base Color
            </h3>
            <span className="font-headline text-xs uppercase tracking-widest text-on-surface-variant">
              {activeColor?.name ?? "Custom"}
            </span>
          </div>
          <SwatchChip selected={shirtColor} onSelect={setShirtColor} />
        </section>

        <section className="mb-10 space-y-4">
          <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
            Image Layers
          </h3>
          <FileDropZone onFilesSelected={addImageAssets} />
        </section>

        <section className="mb-10 space-y-4">
          <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
            Text Layer
          </h3>
          <TextAdder />
        </section>

        <section className="mb-10 space-y-4">
          <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
            Edit Layer
          </h3>
          <LayerEditor />
        </section>

        <section className="mb-10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
              Layers
            </h3>
            <span className="font-headline text-xs uppercase tracking-widest text-on-surface-variant">
              {assets.length} {assets.length === 1 ? "item" : "items"}
            </span>
          </div>
          <LayerList />
        </section>

        <section className="mb-10 space-y-4">
          <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
            Tip
          </h3>
          <p className="border-l-2 border-primary-container/60 bg-surface-container-high px-4 py-3 text-xs leading-relaxed text-on-surface-variant">
            Drag to orbit all the way around the shirt and scroll to zoom. Use
            the View buttons to jump to the front or back, then export your
            design as a PNG.
          </p>
        </section>
      </div>

      <div className="border-t border-outline-variant/20 bg-surface-container-lowest p-8 lg:p-10">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="group relative w-full overflow-hidden bg-primary-container py-6 transition-all active:scale-[0.98] disabled:opacity-70"
        >
          <span className="relative z-10 font-headline text-xl font-black uppercase italic tracking-tighter text-on-primary-container transition-all group-hover:tracking-[0.1em]">
            {submitting ? "Sending..." : "Send Design to Shop"}
          </span>
          <span className="absolute inset-0 translate-y-full bg-white mix-blend-overlay transition-transform duration-300 group-hover:translate-y-0" />
        </button>
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-on-surface-variant opacity-50">
          A shop representative will follow up with a quote.
        </p>
      </div>
    </aside>
  );
}

function CustomizerStage() {
  const [viewSide, setViewSide] = useState<ViewSide>("front");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleExport = () => {
    exportCanvasToPng(canvasRef.current, "artnme-shirt-design.png");
  };

  return (
    <div className="relative h-full w-full bg-surface-container-lowest">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-60">
        <div className="absolute -top-10 left-1/4 h-72 w-72 bg-primary-container/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 bg-primary/10 blur-[120px]" />
      </div>
      <div className="relative z-10 h-full w-full">
        <Scene viewSide={viewSide} onCanvasReady={(c) => (canvasRef.current = c)} />
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
        <div className="mx-1 h-6 w-px bg-outline-variant/30" />
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 bg-primary-container px-4 py-2 font-headline text-[11px] font-black uppercase tracking-widest text-on-primary-container transition-all hover:brightness-110 active:scale-95"
        >
          <span className="material-symbols-outlined text-base">download</span>
          Export PNG
        </button>
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
