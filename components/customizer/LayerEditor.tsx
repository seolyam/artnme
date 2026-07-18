"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  NUDGE_STEP,
  PLACEMENT_BOUNDS,
  ROTATE_STEP,
  SCALE_RANGE,
  useCustomizer,
  type Placement,
} from "./CustomizerProvider";

const clamp = (v: number, bounds: readonly number[]) =>
  Math.max(bounds[0], Math.min(bounds[1], v));

/**
 * 2D editor dashboard for the currently selected design layer — Canva-style
 * controls for placement, nudge, rotate, flip, and resize. No 3D gizmos are
 * used; the 3D viewport stays clean.
 */
export function LayerEditor() {
  const {
    assets,
    selectedAssetId,
    updateAssetTransform,
    setPlacement,
    setFlipped,
    bringToFront,
  } = useCustomizer();

  const [aspectLocked, setAspectLocked] = useState(true);

  const selected = assets.find((asset) => asset.id === selectedAssetId) ?? null;

  if (!selected) {
    return (
      <p className="border border-dashed border-outline-variant/30 bg-surface-container-high px-4 py-6 text-center text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
        Select a layer to edit it
      </p>
    );
  }

  const isBack = selected.placement === "back";
  // On the back, the viewer's right is the shirt's -X, so nudge arrows stay
  // intuitive by inverting the X delta.
  const xSign = isBack ? -1 : 1;

  const nudge = (dxModel: number, dyModel: number) => {
    const nx = clamp(selected.position[0] + dxModel, PLACEMENT_BOUNDS.x);
    const ny = clamp(selected.position[1] + dyModel, PLACEMENT_BOUNDS.y);
    updateAssetTransform(selected.id, {
      position: [nx, ny, selected.position[2]],
    });
  };

  const rotate = (delta: number) => {
    const z = selected.rotation[2] + delta;
    updateAssetTransform(selected.id, {
      rotation: [selected.rotation[0], selected.rotation[1], z],
    });
  };

  const resize = (axis: 0 | 1, value: number) => {
    let w = selected.scale[0];
    let h = selected.scale[1];
    if (aspectLocked) {
      w = value;
      h = value;
    } else if (axis === 0) {
      w = value;
    } else {
      h = value;
    }
    // Keep the projection depth large enough to reach the curved surface.
    const depth = Math.max(w, h);
    updateAssetTransform(selected.id, {
      scale: [w, h, depth],
    });
  };

  return (
    <div className="space-y-5 border border-outline-variant/20 bg-surface-container-high p-4">
      {/* Placement */}
      <div className="space-y-2">
        <Label>Placement</Label>
        <Segmented
          value={selected.placement}
          onChange={(p) => setPlacement(selected.id, p as Placement)}
          options={[
            { value: "front", label: "Front" },
            { value: "back", label: "Back" },
          ]}
        />
      </div>

      {/* Nudge */}
      <div className="space-y-2">
        <Label>Position</Label>
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

      {/* Rotate + Flip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Rotate</Label>
          <div className="flex gap-1">
            <IconButton
              title="Rotate left"
              onClick={() => rotate(-ROTATE_STEP)}
              icon="rotate_left"
              full
            />
            <IconButton
              title="Rotate right"
              onClick={() => rotate(ROTATE_STEP)}
              icon="rotate_right"
              full
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Flip</Label>
          <IconButton
            title={selected.flipped ? "Unflip" : "Flip horizontal"}
            onClick={() => setFlipped(selected.id, !selected.flipped)}
            icon="flip"
            full
            active={selected.flipped}
            label={selected.flipped ? "On" : "Off"}
          />
        </div>
      </div>

      {/* Resize */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Size</Label>
          <button
            type="button"
            onClick={() => setAspectLocked((v) => !v)}
            title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
            className={cn(
              "flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors",
              aspectLocked
                ? "text-primary-container"
                : "text-on-surface-variant/60 hover:text-primary-container",
            )}
          >
            <span className="material-symbols-outlined text-base">
              {aspectLocked ? "link" : "link_off"}
            </span>
            {aspectLocked ? "Linked" : "Free"}
          </button>
        </div>
        <div className="space-y-2">
          <SliderRow
            label="W"
            value={selected.scale[0]}
            onValue={(v) => resize(0, v)}
          />
          <SliderRow
            label="H"
            value={selected.scale[1]}
            onValue={(v) => resize(1, v)}
          />
        </div>
      </div>

      {/* Stack order */}
      <div className="space-y-2">
        <Label>Stack</Label>
        <button
          type="button"
          onClick={() => bringToFront(selected.id)}
          className="flex w-full items-center justify-center gap-2 border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container"
        >
          <span className="material-symbols-outlined text-base">layers</span>
          Bring to front
        </button>
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
  full,
  active,
  label,
}: {
  icon: string;
  onClick: () => void;
  title: string;
  full?: boolean;
  active?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex items-center justify-center gap-1 border border-outline-variant/30 bg-surface-container-lowest p-2 text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        full && "flex-1",
        active && "border-primary-container text-primary-container",
      )}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
      {label && (
        <span className="font-headline text-[10px] uppercase tracking-widest">
          {label}
        </span>
      )}
    </button>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex border border-outline-variant/30">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 px-3 py-2 font-headline text-xs font-bold uppercase tracking-widest transition-colors",
              isActive
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-lowest text-on-surface-variant hover:text-primary-container",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SliderRow({
  label,
  value,
  onValue,
}: {
  label: string;
  value: number;
  onValue: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-3 font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <Slider
        min={SCALE_RANGE[0]}
        max={SCALE_RANGE[1]}
        step={0.01}
        value={[value]}
        onValueChange={(v) => onValue(v[0] ?? value)}
        aria-label={`${label} size`}
        className="flex-1"
      />
      <span className="w-8 text-right font-headline text-[10px] uppercase tracking-widest text-on-surface-variant/70 tabular-nums">
        {Math.round((value / SCALE_RANGE[1]) * 100)}%
      </span>
    </div>
  );
}