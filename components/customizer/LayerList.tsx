"use client";

import { cn } from "@/lib/utils";
import { useCustomizer } from "./CustomizerProvider";

/**
 * Layer list of every placed design asset. Clicking a layer selects it and
 * shows its 3D transform handles on the shirt; layers can be toggled or
 * removed individually.
 */
export function LayerList() {
  const {
    assets,
    selectedAssetId,
    selectAsset,
    toggleAssetVisibility,
    removeAsset,
  } = useCustomizer();

  if (assets.length === 0) {
    return (
      <p className="border border-dashed border-outline-variant/30 bg-surface-container-high px-4 py-6 text-center text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
        No layers yet — upload an image or add text
      </p>
    );
  }

  // Newest layer on top, mirroring the draw order on the shirt.
  const ordered = [...assets].reverse();

  return (
    <ul className="space-y-2" role="listbox" aria-label="Design layers">
      {ordered.map((asset) => {
        const isSelected = asset.id === selectedAssetId;
        const label =
          asset.kind === "text"
            ? `"${asset.text}"`
            : (asset.fileName ?? "Image layer");
        return (
          <li
            key={asset.id}
            role="option"
            aria-selected={isSelected}
            onClick={() => selectAsset(isSelected ? null : asset.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectAsset(isSelected ? null : asset.id);
              }
            }}
            tabIndex={0}
            className={cn(
              "group flex cursor-pointer items-center gap-3 border p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-primary-container bg-primary-container/10"
                : "border-outline-variant/20 bg-surface-container-high hover:border-primary-container/60",
            )}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden bg-surface-container-lowest">
              {asset.kind === "image" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={asset.url}
                  alt=""
                  className="h-full w-full object-contain"
                />
              ) : (
                <span
                  className="font-headline text-lg font-black"
                  style={{ color: asset.textColor }}
                  aria-hidden
                >
                  T
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-headline text-xs font-bold uppercase tracking-tight text-on-surface dark:text-white">
                {label}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                {isSelected
                  ? `Editing — ${asset.placement} side`
                  : asset.kind === "text"
                    ? "Text layer"
                    : "Image layer"}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleAssetVisibility(asset.id);
              }}
              title={asset.visible ? "Hide layer" : "Show layer"}
              aria-label={asset.visible ? "Hide layer" : "Show layer"}
              className={cn(
                "p-1 transition-colors",
                asset.visible
                  ? "text-on-surface-variant hover:text-primary-container"
                  : "text-on-surface-variant/40 hover:text-primary-container",
              )}
            >
              <span className="material-symbols-outlined text-xl">
                {asset.visible ? "visibility" : "visibility_off"}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeAsset(asset.id);
              }}
              title="Delete layer"
              aria-label="Delete layer"
              className="p-1 text-on-surface-variant transition-colors hover:text-error"
            >
              <span className="material-symbols-outlined text-xl">delete</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
