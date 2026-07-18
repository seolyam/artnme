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

export type AssetKind = "image" | "text";
export type Placement = "front" | "back";

export interface DesignAsset {
  id: string;
  kind: AssetKind;
  /** Object URL for image assets. Empty string for text assets (texture is generated). */
  url: string;
  /** Original file name for image assets. */
  fileName: string | null;
  /** Content for text assets. */
  text?: string;
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

export interface CustomizerState {
  shirtColor: string;
  setShirtColor: (color: string) => void;
  assets: DesignAsset[];
  selectedAssetId: string | null;
  selectAsset: (id: string | null) => void;
  addImageAssets: (files: File[]) => void;
  addTextAsset: (text: string, color: string) => void;
  updateAssetTransform: (id: string, patch: AssetTransformPatch) => void;
  setPlacement: (id: string, placement: Placement) => void;
  setFlipped: (id: string, flipped: boolean) => void;
  bringToFront: (id: string) => void;
  toggleAssetVisibility: (id: string) => void;
  removeAsset: (id: string) => void;
}

const CustomizerContext = createContext<CustomizerState | null>(null);

function createImageAsset(file: File, url: string): DesignAsset {
  return {
    id: crypto.randomUUID(),
    kind: "image",
    url,
    fileName: file.name,
    placement: "front",
    flipped: false,
    position: [...DEFAULT_FRONT_POSITION],
    rotation: [...DEFAULT_ASSET_ROTATION],
    scale: [...DEFAULT_ASSET_SCALE],
    visible: true,
  };
}

function createTextAsset(text: string, color: string): DesignAsset {
  return {
    id: crypto.randomUUID(),
    kind: "text",
    url: "",
    fileName: null,
    text,
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

export function CustomizerProvider({ children }: { children: ReactNode }) {
  const [shirtColor, setShirtColor] = useState<string>("#FFFFFF");
  const [assets, setAssets] = useState<DesignAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Tracks live assets so object URLs can be revoked on unmount.
  const assetsRef = useRef<DesignAsset[]>(assets);
  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  const selectAsset = useCallback((id: string | null) => {
    setSelectedAssetId(id);
  }, []);

  const addImageAssets = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    const newAssets = images.map((file) =>
      createImageAsset(file, URL.createObjectURL(file)),
    );
    setAssets((prev) => [...prev, ...newAssets]);
    setSelectedAssetId(newAssets[newAssets.length - 1].id);
  }, []);

  const addTextAsset = useCallback((text: string, color: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const asset = createTextAsset(trimmed, color);
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
        if (asset.id !== id) return asset;
        const isAlready = asset.placement === placement;
        if (isAlready) return asset;
        // Flip the projector to the opposite side: invert z and add π to
        // rotation.y, preserving the user's x/y nudge, in-plane spin & scale.
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
    setAssets((prev) => {
      const target = prev.find((asset) => asset.id === id);
      if (target?.kind === "image" && target.url) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((asset) => asset.id !== id);
    });
    setSelectedAssetId((prev) => (prev === id ? null : prev));
  }, []);

  // Revoke every outstanding object URL when the provider unmounts.
  useEffect(() => {
    return () => {
      for (const asset of assetsRef.current) {
        if (asset.kind === "image" && asset.url) {
          URL.revokeObjectURL(asset.url);
        }
      }
    };
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
