"use client";

import { useEffect, useMemo, useRef } from "react";
import { Decal, useGLTF, useTexture } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { DesignAsset } from "./CustomizerProvider";

const SHIRT_URL = "/images/shirt.glb";

/** Ignore click events that were actually orbit drags (moved > 6px). */
const CLICK_DRAG_TOLERANCE = 6;

interface ShirtProps {
  shirtColor: string;
  assets: DesignAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (id: string | null) => void;
}

export function Shirt({
  shirtColor,
  assets,
  selectedAssetId,
  onSelectAsset,
}: ShirtProps) {
  const { scene } = useGLTF(SHIRT_URL);
  const meshRef = useRef<THREE.Mesh>(null);

  const targetColor = useRef(new THREE.Color(shirtColor));

  useEffect(() => {
    targetColor.current.set(shirtColor);
  }, [shirtColor]);

  const mergedGeometry = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = [];
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        const geo = mesh.geometry.clone();
        mesh.updateWorldMatrix(true, false);
        geo.applyMatrix4(mesh.matrixWorld);
        geometries.push(geo);
      }
    });

    if (geometries.length === 0) return null;

    const merged = mergeGeometries(geometries, false);
    if (!merged) return null;

    merged.computeVertexNormals();
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    return merged;
  }, [scene]);

  useFrame((_, delta) => {
    const material = meshRef.current?.material as
      | THREE.MeshStandardMaterial
      | undefined;
    if (material?.color) {
      easing.dampC(material.color, targetColor.current, 0.45, delta);
    }
  });

  const handleShirtClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_DRAG_TOLERANCE) return;
    onSelectAsset(null);
  };

  if (!mergedGeometry) return null;

  // The merged geometry is already upright with the front facing +Z, so the
  // shirt mesh needs no corrective rotation here. The 3D viewport stays clean —
  // there are no transform gizmos; all editing happens in the 2D side panel.
  return (
    <mesh
      ref={meshRef}
      geometry={mergedGeometry}
      castShadow
      receiveShadow
      onClick={handleShirtClick}
    >
      <meshStandardMaterial
        color={shirtColor}
        roughness={0.85}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
      {assets
        .filter((asset) => asset.visible)
        .map((asset) => {
          // Stable stack index from the canonical asset array so each decal
          // gets a unique depth plane (higher index = drawn on top).
          const layerIndex = assets.indexOf(asset);
          return (
            <AssetDecal
              key={asset.id}
              asset={asset}
              layerIndex={layerIndex}
              selected={asset.id === selectedAssetId}
              onSelect={onSelectAsset}
            />
          );
        })}
    </mesh>
  );
}

interface AssetDecalProps {
  asset: DesignAsset;
  layerIndex: number;
  selected: boolean;
  onSelect: (id: string | null) => void;
}

function AssetDecal({ asset, layerIndex, selected, onSelect }: AssetDecalProps) {
  const texture = useAssetTexture(asset);

  // Rigid placement; drei <Decal> does NOT apply position/rotation/scale to the
  // mesh object — it only bakes them into the geometry. The decal mesh transform
  // stays identity, so no manual matrix bookkeeping is required.
  const ringRadius = Math.max(asset.scale[0], asset.scale[1]);

  // Depth of the Decal projection box (the projector's Z size). X/Y stay exactly
  // as the user set them — only Z is tuned here.
  //
  // The shirt is a thin shell: front panel ~ z[0.08, 0.10], interior cavity
  // ~ z[-0.08, 0.08], back panel ~ z[-0.10, -0.08]. The projector box is centred
  // on position.z (which is biased outward: 0.14 front / -0.14 back) and spans
  // ±depth/2, so the box's inner face sits at position.z - depth/2.
  //
  // Goldilocks depth:
  //  - Too shallow (depth ≈ footprint): the box leaves the surface as soon as
  //    it curves over the collarbone/shoulders/armpits, slicing the artwork.
  //  - Too deep (depth = footprint * 5): the box punches through the cavity
  //    and bakes the decal onto the opposite wall — "punch-through".
  //
  // We scale mildly with the footprint (bigger art spans more curvature) but
  // cap hard at 0.22 so the inner face never reaches the back panel. With
  // position.z = 0.14 and depth <= 0.22, the inner face stays >= 0.03 (inside
  // the cavity, ahead of the back panel at -0.08) — front art stays front-only.
  const footprint = Math.max(asset.scale[0], asset.scale[1]);
  const projectionDepth = THREE.MathUtils.clamp(
    footprint * 0.5 + 0.08,
    0.14,
    0.22,
  );

  const decalScale: [number, number, number] = [
    asset.scale[0],
    asset.scale[1],
    projectionDepth,
  ];

  return (
    <>
      <Decal
        position={asset.position}
        rotation={asset.rotation}
        scale={decalScale}
        map={texture}
        // Z-fighting fix: enable depth testing so the shirt occludes decals on
        // the far side, and give each stacked layer its own offset so overlapping
        // decals never flicker or vanish. Higher layers pull closer (more
        // negative factor) and draw later (higher renderOrder) so they win.
        depthTest
        polygonOffsetFactor={-10 - layerIndex}
        renderOrder={layerIndex}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta > CLICK_DRAG_TOLERANCE) return;
          e.stopPropagation();
          onSelect(asset.id);
        }}
      />
      {selected && (
        // Selection outline as a sibling (the Decal mesh sits at the origin),
        // placed at the projector pose and nudged outward along its local +Z so
        // it floats just above the artwork without z-fighting.
        <group position={asset.position} rotation={asset.rotation}>
          <mesh position={[0, 0, 0.012]} renderOrder={9999}>
            <ringGeometry args={[ringRadius * 0.92, ringRadius * 0.99, 80]} />
            <meshBasicMaterial
              color="#e31e24"
              transparent
              opacity={0.9}
              depthTest={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </>
  );
}

/**
 * Resolves the THREE texture for an asset: object-URL images are loaded with
 * the drei texture cache (mirrored when flipped), text assets are rasterized
 * onto a canvas (flipped in-place).
 */
function useAssetTexture(asset: DesignAsset): THREE.Texture {
  const imageTexture = useImageTexture(asset.kind === "image" ? asset.url : null);
  const textTexture = useTextTexture(
    asset.kind === "text" ? (asset.text ?? "") : null,
    asset.textColor ?? "#D32F2F",
    asset.flipped,
  );

  // For images, mirror via a cloned texture (repeat.x = -1) only when flipped,
  // so the shared_cached source texture is never mutated.
  const flippedImage = useMemo(() => {
    if (!imageTexture || !asset.flipped) return imageTexture;
    const clone = imageTexture.clone();
    clone.needsUpdate = true;
    clone.wrapS = THREE.RepeatWrapping;
    clone.repeat.x = -1;
    clone.offset.x = 1;
    return clone;
  }, [imageTexture, asset.flipped]);

  useEffect(() => {
    return () => {
      if (flippedImage && flippedImage !== imageTexture) {
        flippedImage.dispose();
      }
    };
  }, [flippedImage, imageTexture]);

  return asset.kind === "image" ? flippedImage! : textTexture!;
}

function useImageTexture(url: string | null): THREE.Texture | null {
  // useTexture does not accept null/undefined, so fall back to a 1px data URI
  // that is never actually rendered for non-image assets.
  const texture = useTexture(url ?? TRANSPARENT_PIXEL, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  });
  return url ? texture : null;
}

const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function useTextTexture(
  text: string | null,
  color: string,
  flipped: boolean,
): THREE.Texture | null {
  const texture = useMemo(() => {
    if (!text) return null;
    return createTextTexture(text, color, flipped);
  }, [text, color, flipped]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return texture;
}

function createTextTexture(
  text: string,
  color: string,
  flipped: boolean,
): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (flipped) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  let fontSize = 220;
  const maxWidth = canvas.width * 0.88;
  const fontStack = '"Space Grotesk", "Arial Black", Arial, sans-serif';
  ctx.font = `900 ${fontSize}px ${fontStack}`;
  const measured = ctx.measureText(text).width;
  if (measured > maxWidth) {
    fontSize = Math.floor((fontSize * maxWidth) / measured);
    ctx.font = `900 ${fontSize}px ${fontStack}`;
  }
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

useGLTF.preload(SHIRT_URL);