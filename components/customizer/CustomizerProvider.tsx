"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ThreeSnapshot } from "@/lib/customizer/export";

export type AssetKind = "image" | "text";
export type Placement = "front" | "back";

export interface DesignAsset {
  id: string;
  kind: AssetKind;
  /**
   * Source for the artwork. For image assets this is a Base64 data URL string
   * (compressed on upload) so it survives a page refresh / localStorage round
   * trip — ObjectURLs cannot be persisted. For text assets this is empty.
   */
  url: string;
  /** Original file name for image assets. */
  fileName: string | null;
  /** Content for text assets. */
  text?: string;
  /** Font family for text assets. */
  fontFamily?: string;
  /** Fill color for text assets. */
  textColor?: string;
  /** Which side of the shirt the decal is projected onto. */
  placement: Placement;
  /** Horizontally mirror the artwork (text reads correctly on each side). */
  flipped: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visible: boolean;
}

export interface AssetTransformPatch {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

/**
 * Default placement for new assets, derived from /images/shirt.glb
 * (merged-geometry space: upright shirt, hem y=0.92, shoulders y=1.63,
 * front faces +Z; front chest surface sits at z ~ 0.10, back ~ -0.10).
 */
export const DEFAULT_FRONT_POSITION: [number, number, number] = [0, 1.36, 0.14];
export const DEFAULT_BACK_POSITION: [number, number, number] = [0, 1.36, -0.14];
export const DEFAULT_ASSET_ROTATION: [number, number, number] = [0, 0, 0];
/** Rotation.y offset applied when a decal is moved to the back so it faces -Z. */
export const BACK_ROTATION_Y = Math.PI;
export const DEFAULT_ASSET_SCALE: [number, number, number] = [0.28, 0.28, 0.28];
/** Slightly smaller default for text layers so words fit the chest. */
export const DEFAULT_TEXT_SCALE: [number, number, number] = [0.24, 0.24, 0.24];

/** Nudge step (decimeters in model units) for the 2D arrow controls. */
export const NUDGE_STEP = 0.02;
/** Rotation step (radians) for the 2D rotate controls. 15°. */
export const ROTATE_STEP = Math.PI / 12;
/** Bounds so nudged artwork stays on the printable chest area. */
export const PLACEMENT_BOUNDS = {
  x: [-0.27, 0.27],
  y: [1.02, 1.62],
};
export const SCALE_RANGE: [number, number] = [0.08, 0.7];

export const TEXT_COLOR_CHOICES = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#111111" },
  { name: "Red", hex: "#D32F2F" },
  { name: "Gold", hex: "#C9A227" },
  { name: "Navy", hex: "#1B2A4A" },
] as const;

export const FONT_CHOICES = [
  "Inter",
  "Space Grotesk",
  "Merriweather",
  "Outfit",
] as const;

interface PersistedDraft {
  v: number;
  shirtColor: string;
  assets: DesignAsset[];
}

const STORAGE_KEY = "print_shop_draft";
const DRAFT_VERSION = 1;
/** Max edge length in px when rasterizing an uploaded image to Base64. */
const MAX_TEXTURE_EDGE = 1024;
/** JPEG quality when the source has no alpha channel. */
const JPEG_QUALITY = 0.85;

export interface CustomizerState {
  shirtColor: string;
  setShirtColor: (color: string) => void;
  assets: DesignAsset[];
  selectedAssetId: string | null;
  selectAsset: (id: string | null) => void;
  addImageAssets: (files: File[]) => void;
  addTextAsset: (text: string, color: string, fontFamily?: string) => void;
  updateAssetTransform: (id: string, patch: AssetTransformPatch) => void;
  setPlacement: (id: string, placement: Placement) => void;
  setFlipped: (id: string, flipped: boolean) => void;
  bringToFront: (id: string) => void;
  toggleAssetVisibility: (id: string) => void;
  removeAsset: (id: string) => void;
  clearDraft: () => void;
  /**
   * False until the provider has read (or attempted to read) the saved draft
   * from localStorage. Consumers should gate rendering of restored state on
   * this to avoid Next.js hydration mismatches.
   */
  hydrated: boolean;
  /** True the first time a non-empty draft is restored. */
  draftRestored: boolean;
  /**
   * Live R3F runtime handle (renderer, scene, camera, controls) bridged out of
   * the @react-three/fiber <Canvas> by R3FStateBridge. Used by the Export
   * button to drive a programmatic multi-angle capture.
   */
  threeRef: { current: ThreeSnapshot | null };
}

const CustomizerContext = createContext<CustomizerState | null>(null);

function createImageAsset(file: File, dataUrl: string): DesignAsset {
  return {
    id: crypto.randomUUID(),
    kind: "image",
    url: dataUrl,
    fileName: file.name,
    placement: "front",
    flipped: false,
    position: [...DEFAULT_FRONT_POSITION],
    rotation: [...DEFAULT_ASSET_ROTATION],
    scale: [...DEFAULT_ASSET_SCALE],
    visible: true,
  };
}

function createTextAsset(text: string, color: string, fontFamily: string = "Inter"): DesignAsset {
  return {
    id: crypto.randomUUID(),
    kind: "text",
    url: "",
    fileName: null,
    text,
    fontFamily,
    textColor: color,
    placement: "front",
    flipped: false,
    position: [
      DEFAULT_FRONT_POSITION[0],
      DEFAULT_FRONT_POSITION[1] + 0.08,
      DEFAULT_FRONT_POSITION[2],
    ],
    rotation: [...DEFAULT_ASSET_ROTATION],
    scale: [...DEFAULT_TEXT_SCALE],
    visible: true,
  };
}

/**
 * Rasterizes an uploaded image File to a compressed Base64 data URL. PNG/SVG
 * keep their alpha channel (logos need transparency); opaque formats are JPEG
 * compressed. Output is downscaled to a max edge so large photos don't bloat
 * localStorage or stall the main thread. Runs offline — nothing is uploaded to
 * Cloudinary until the customer submits the final design.
 */
function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_TEXTURE_EDGE || height > MAX_TEXTURE_EDGE) {
          const scale = MAX_TEXTURE_EDGE / Math.max(width, height);
          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Preserve transparency for PNG/SVG/GIF (logos typically need alpha);
        // everything else becomes a compressed JPEG.
        const keepAlpha =
          file.type === "image/png" ||
          file.type === "image/svg+xml" ||
          file.type === "image/gif";
        resolve(
          keepAlpha
            ? canvas.toDataURL("image/png")
            : canvas.toDataURL("image/jpeg", JPEG_QUALITY),
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function isPersistableDraft(value: unknown): value is PersistedDraft {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.assets) && typeof v.shirtColor === "string";
}

export function CustomizerProvider({ children }: { children: ReactNode }) {
  const [shirtColor, setShirtColor] = useState<string>("#FFFFFF");
  const [assets, setAssets] = useState<DesignAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  // Starts false on the server AND the first client render so both produce the
  // same placeholder UI, then flips after the draft is restored — no hydration
  // mismatch.
  const [hydrated, setHydrated] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const threeRef = useRef<ThreeSnapshot | null>(null);

  // --- Hydration: read the saved draft once on mount (client-only). ---------
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isPersistableDraft(parsed) && parsed.v === DRAFT_VERSION) {
          if (parsed.assets.length > 0 || parsed.shirtColor !== "#FFFFFF") {
            setDraftRestored(true);
          }
          setShirtColor(parsed.shirtColor);
          setAssets(parsed.assets);
        }
      }
    } catch {
      // Corrupt draft or quota issues — silently start fresh.
    } finally {
      setHydrated(true);
    }
  }, []);

  // --- Auto-save: persist whenever the design changes, after hydration. -----
  // Gating on `hydrated` is essential: before hydration the initial empty
  // state would otherwise overwrite the draft.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const draft: PersistedDraft = { v: DRAFT_VERSION, shirtColor, assets };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Quota exceeded (too many/large images) — keep the session in memory;
      // we don't block the user's editing flow over persistence failure.
    }
  }, [hydrated, shirtColor, assets]);

  const selectAsset = useCallback((id: string | null) => {
    setSelectedAssetId(id);
  }, []);

  const addImageAssets = useCallback(async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    // Convert each file to a Base64 data URL off the render path. toDataURL is
    // synchronous-ish and runs per-file; large batches will still serialize via
    // Promise.all, keeping the main thread responsive between decodes.
    const dataUrls = await Promise.all(
      images.map((file) => fileToCompressedDataUrl(file).catch(() => "")),
    );
    const newAssets: DesignAsset[] = [];
    images.forEach((file, i) => {
      if (!dataUrls[i]) return;
      newAssets.push(createImageAsset(file, dataUrls[i]));
    });
    if (newAssets.length === 0) return;
    setAssets((prev) => [...prev, ...newAssets]);
    setSelectedAssetId(newAssets[newAssets.length - 1].id);
  }, []);

  const addTextAsset = useCallback((text: string, color: string, fontFamily?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const asset = createTextAsset(trimmed, color, fontFamily);
    setAssets((prev) => [...prev, asset]);
    setSelectedAssetId(asset.id);
  }, []);

  const updateAssetTransform = useCallback(
    (id: string, patch: AssetTransformPatch) => {
      setAssets((prev) =>
        prev.map((asset) => (asset.id === id ? { ...asset, ...patch } : asset)),
      );
    },
    [],
  );

  const setPlacement = useCallback((id: string, placement: Placement) => {
    setAssets((prev) =>
      prev.map((asset) => {
        if (asset.id !== id || asset.placement === placement) return asset;
        return {
          ...asset,
          placement,
          position: [asset.position[0], asset.position[1], -asset.position[2]],
          rotation: [
            asset.rotation[0],
            asset.rotation[1] + BACK_ROTATION_Y,
            asset.rotation[2],
          ],
        };
      }),
    );
  }, []);

  const setFlipped = useCallback((id: string, flipped: boolean) => {
    setAssets((prev) =>
      prev.map((asset) => (asset.id === id ? { ...asset, flipped } : asset)),
    );
  }, []);

  const bringToFront = useCallback((id: string) => {
    setAssets((prev) => {
      const idx = prev.findIndex((asset) => asset.id === id);
      if (idx === -1) return prev;
      const [moved] = prev.splice(idx, 1);
      return [...prev, moved];
    });
  }, []);

  const toggleAssetVisibility = useCallback((id: string) => {
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === id ? { ...asset, visible: !asset.visible } : asset,
      ),
    );
  }, []);

  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
    setSelectedAssetId((prev) => (prev === id ? null : prev));
  }, []);

  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    setShirtColor("#FFFFFF");
    setAssets([]);
    setSelectedAssetId(null);
  }, []);

  return (
    <CustomizerContext.Provider
      value={{
        shirtColor,
        setShirtColor,
        assets,
        selectedAssetId,
        selectAsset,
        addImageAssets,
        addTextAsset,
        updateAssetTransform,
        setPlacement,
        setFlipped,
        bringToFront,
        toggleAssetVisibility,
        removeAsset,
        clearDraft,
        hydrated,
        draftRestored,
        threeRef,
      }}
    >
      {children}
    </CustomizerContext.Provider>
  );
}

export function useCustomizer() {
  const ctx = useContext(CustomizerContext);
  if (!ctx) {
    throw new Error("useCustomizer must be used within a CustomizerProvider");
  }
  return ctx;
}