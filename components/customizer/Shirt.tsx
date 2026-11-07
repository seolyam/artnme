"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Decal, useGLTF, useTexture } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { DesignAsset } from "./CustomizerProvider";
import { loadStudioFont, studioFontStack } from "@/lib/customizer/fonts";

const SHIRT_URL = "/images/shirt.glb";

/** Ignore click events that were actually orbit drags (moved > 6px). */
const CLICK_DRAG_TOLERANCE = 6;

/**
 * z of the plane halfway between the front and back panels of shirt.glb.
 * Measured from the mesh: the front panel sits at z ≈ +0.01…+0.15 (thinnest
 * at the collar and side seams), the back at z ≈ −0.07…−0.16, so the gap
 * between them is centred a little behind z = 0.
 */
const SHELL_MID_Z = -0.03;

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

/** Gap between the print's edge and the outline, and the outline's thickness (model units). */
const FRAME_GAP = 0.01;
const FRAME_LINE = 0.006;

/**
 * Thin rectangle hugging the selected print. (It used to be a circle whose
 * radius was the print's full width, so it drew at twice the print's size and
 * swallowed most of the shirt on large prints.)
 */
function SelectionFrame({ width, height }: { width: number; height: number }) {
  const geometry = useMemo(() => {
    const w = width / 2 + FRAME_GAP;
    const h = height / 2 + FRAME_GAP;
    const outer = new THREE.Shape();
    outer.moveTo(-w, -h);
    outer.lineTo(w, -h);
    outer.lineTo(w, h);
    outer.lineTo(-w, h);
    outer.closePath();
    const inner = new THREE.Path();
    inner.moveTo(-w + FRAME_LINE, -h + FRAME_LINE);
    inner.lineTo(-w + FRAME_LINE, h - FRAME_LINE);
    inner.lineTo(w - FRAME_LINE, h - FRAME_LINE);
    inner.lineTo(w - FRAME_LINE, -h + FRAME_LINE);
    inner.closePath();
    outer.holes.push(inner);
    return new THREE.ShapeGeometry(outer);
  }, [width, height]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh name="selection-frame" geometry={geometry} position={[0, 0, 0.012]} renderOrder={9999}>
      <meshBasicMaterial color="#e31e24" transparent opacity={0.9} depthTest={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function AssetDecal({ asset, layerIndex, selected, onSelect }: AssetDecalProps) {
  const texture = useAssetTexture(asset);

  // Rigid placement; drei <Decal> does NOT apply position/rotation/scale to the
  // mesh object — it only bakes them into the geometry. The decal mesh transform
  // stays identity, so no manual matrix bookkeeping is required.

  // Depth of the Decal projection box (the projector's Z size). X/Y stay exactly
  // as the user set them — only Z is tuned here.
  //
  // The projector box is centred on position.z (biased outward: 0.14 front /
  // -0.14 back) and spans ±depth/2. Everything inside the box gets the print:
  //  - Too shallow: the box leaves the surface as it curves over the
  //    collarbone/shoulders/side seams, slicing the artwork.
  //  - Too deep: the box crosses the cavity and bakes a mirrored copy onto
  //    the opposite panel ("punch-through"). The shell is thinnest at the
  //    collar and side seams, so large prints punched through there when the
  //    depth grew with the print size.
  //
  // So the inner face is pinned to the shell's mid-plane instead: the box
  // reaches all of its own panel and none of the other, whatever the size.
  const projectionDepth = 2 * Math.abs(asset.position[2] - SHELL_MID_Z);

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
          <SelectionFrame width={asset.scale[0]} height={asset.scale[1]} />
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
    asset.fontFamily,
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
  fontFamily: string = "Inter",
): THREE.Texture | null {
  // Redraw once the chosen font has downloaded; until then the canvas would
  // quietly use Arial.
  const [loadedFont, setLoadedFont] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadStudioFont(fontFamily).then(() => live && setLoadedFont(fontFamily));
    return () => {
      live = false;
    };
  }, [fontFamily]);

  const texture = useMemo(() => {
    if (!text) return null;
    return createTextTexture(text, color, flipped, fontFamily);
    // loadedFont is only here to redraw once the font is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, color, flipped, fontFamily, loadedFont]);

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
  fontFamily: string = "Inter",
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
  const fontStack = studioFontStack(fontFamily);
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