"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { useCustomizer, type Placement, BACK_ROTATION_Y, NUDGE_STEP, PLACEMENT_BOUNDS, SCALE_RANGE } from "./CustomizerProvider";

const clamp = (v: number, bounds: readonly number[]) =>
  Math.max(bounds[0], Math.min(bounds[1], v));

const PRESETS = [
  {
    id: "left-chest",
    label: "Left Chest",
    placement: "front" as Placement,
    position: [-0.12, 1.45, 0.14],
    scale: [0.12, 0.12, 0.15],
  },
  {
    id: "center-chest",
    label: "Center Chest",
    placement: "front" as Placement,
    position: [0, 1.4, 0.14],
    scale: [0.3, 0.3, 0.3],
  },
  {
    id: "full-front",
    label: "Full Front",
    placement: "front" as Placement,
    position: [0, 1.25, 0.14],
    scale: [0.5, 0.5, 0.5],
  },
  {
    id: "upper-back",
    label: "Upper Back",
    placement: "back" as Placement,
    position: [0, 1.5, -0.14],
    scale: [0.2, 0.2, 0.2],
  },
  {
    id: "full-back",
    label: "Full Back",
    placement: "back" as Placement,
    position: [0, 1.25, -0.14],
    scale: [0.5, 0.5, 0.5],
  },
];

export function LayerEditor() {
  const [isLinked, setIsLinked] = useState(true);
  const {
    assets,
    selectedAssetId,
    updateAssetTransform,
    setPlacement,
    setFlipped,
    bringToFront,
  } = useCustomizer();

  const selected = assets.find((asset) => asset.id === selectedAssetId) ?? null;

  if (!selected) {
    return (
      <p className="border border-dashed border-outline-variant/30 bg-surface-container-high px-4 py-6 text-center text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
        Select a layer to edit it
      </p>
    );
  }

  const isBack = selected.placement === "back";
  const xSign = isBack ? -1 : 1;

  const nudge = (dxModel: number, dyModel: number) => {
    const nx = clamp(selected.position[0] + dxModel, PLACEMENT_BOUNDS.x);
    const ny = clamp(selected.position[1] + dyModel, PLACEMENT_BOUNDS.y);
    updateAssetTransform(selected.id, {
      position: [nx, ny, selected.position[2]],
    });
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const maxScale = Math.max(preset.scale[0], preset.scale[1]);
    const currentAspect = selected.scale[0] / selected.scale[1];
    
    let newW = maxScale;
    let newH = maxScale;
    if (currentAspect > 1) {
      newH = maxScale / currentAspect;
    } else {
      newW = maxScale * currentAspect;
    }

    setPlacement(selected.id, preset.placement);
    updateAssetTransform(selected.id, {
      position: [preset.position[0], preset.position[1], preset.position[2]] as [number, number, number],
      scale: [newW, newH, Math.max(newW, newH)],
    });
  };

  return (
    <div className="space-y-6 border border-outline-variant/20 bg-surface-container-high p-6 shadow-sm">
      <div className="space-y-3">
        <Label>Placement Side</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setPlacement(selected.id, "front")}
            className={cn(
              "flex-1 py-2 text-center font-headline text-[10px] font-bold uppercase tracking-widest border transition-all",
              !isBack
                ? "bg-primary-container text-on-primary-container border-primary-container"
                : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:border-primary-container"
            )}
          >
            Front
          </button>
          <button
            onClick={() => setPlacement(selected.id, "back")}
            className={cn(
              "flex-1 py-2 text-center font-headline text-[10px] font-bold uppercase tracking-widest border transition-all",
              isBack
                ? "bg-primary-container text-on-primary-container border-primary-container"
                : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:border-primary-container"
            )}
          >
            Back
          </button>
        </div>
      </div>

      <div className="space-y-3 border-t border-outline-variant/20 pt-4">
        <Label>Quick Placement</Label>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="bg-surface-container-lowest px-2 py-2 text-center font-headline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container active:scale-95 border border-outline-variant/20"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-outline-variant/20 pt-4">
        <div className="flex items-center justify-between">
          <Label>Dimensions</Label>
          <button
            onClick={() => setIsLinked(!isLinked)}
            title={isLinked ? "Unlink aspect ratio" : "Link aspect ratio"}
            className={cn(
              "flex items-center justify-center p-1 border transition-colors",
              isLinked
                ? "border-primary-container text-primary-container bg-primary-container/10"
                : "border-outline-variant/30 text-on-surface-variant hover:border-primary-container"
            )}
          >
            <span className="material-symbols-outlined text-sm">
              {isLinked ? "link" : "link_off"}
            </span>
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-12 text-[10px] font-bold uppercase text-on-surface-variant">Width</span>
            <input
              type="range"
              min={SCALE_RANGE[0]}
              max={SCALE_RANGE[1]}
              step={0.01}
              value={selected.scale[0]}
              onChange={(e) => {
                const newW = parseFloat(e.target.value);
                let newH = selected.scale[1];
                if (isLinked) {
                  const aspect = selected.scale[0] / selected.scale[1];
                  newH = newW / aspect;
                }
                updateAssetTransform(selected.id, {
                  scale: [newW, newH, selected.scale[2]],
                });
              }}
              className="flex-1 accent-[#E31E24]"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="w-12 text-[10px] font-bold uppercase text-on-surface-variant">Height</span>
            <input
              type="range"
              min={SCALE_RANGE[0]}
              max={SCALE_RANGE[1]}
              step={0.01}
              value={selected.scale[1]}
              onChange={(e) => {
                const newH = parseFloat(e.target.value);
                let newW = selected.scale[0];
                if (isLinked) {
                  const aspect = selected.scale[0] / selected.scale[1];
                  newW = newH * aspect;
                }
                updateAssetTransform(selected.id, {
                  scale: [newW, newH, selected.scale[2]],
                });
              }}
              className="flex-1 accent-[#E31E24]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-outline-variant/20 pt-4">
        <Label>Fine Tune Position</Label>
        <div className="mx-auto grid w-32 grid-cols-3 gap-1">
          <span />
          <IconButton
            title="Move up"
            onClick={() => nudge(0, NUDGE_STEP)}
            icon="arrow_upward"
          />
          <span />
          <IconButton
            title="Move left"
            onClick={() => nudge(-NUDGE_STEP * xSign, 0)}
            icon="arrow_back"
          />
          <div className="flex items-center justify-center text-on-surface-variant/40">
            <span className="material-symbols-outlined text-base">center_focus_strong</span>
          </div>
          <IconButton
            title="Move right"
            onClick={() => nudge(NUDGE_STEP * xSign, 0)}
            icon="arrow_forward"
          />
          <span />
          <IconButton
            title="Move down"
            onClick={() => nudge(0, -NUDGE_STEP)}
            icon="arrow_downward"
          />
          <span />
        </div>
      </div>

      <div className="space-y-3 border-t border-outline-variant/20 pt-4">
        <Label>Actions</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setFlipped(selected.id, !selected.flipped)}
            className={cn(
              "flex items-center justify-center gap-2 border border-outline-variant/30 px-3 py-3 font-headline text-[11px] font-bold uppercase tracking-widest transition-colors",
              selected.flipped 
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-lowest text-on-surface-variant hover:border-primary-container hover:text-primary-container"
            )}
          >
            <span className="material-symbols-outlined text-base">flip</span>
            {selected.flipped ? "Unflip" : "Flip"}
          </button>
          <button
            onClick={() => bringToFront(selected.id)}
            className="flex items-center justify-center gap-2 border border-outline-variant/30 bg-surface-container-lowest px-3 py-3 font-headline text-[11px] font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container"
          >
            <span className="material-symbols-outlined text-base">layers</span>
            Bring Forward
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
      {children}
    </span>
  );
}

function IconButton({
  icon,
  onClick,
  title,
}: {
  icon: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex items-center justify-center gap-1 border border-outline-variant/30 bg-surface-container-lowest p-2 text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
  );
}