"use client";

import { Suspense, useEffect, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Center,
  ContactShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import { Shirt } from "./Shirt";
import { useCustomizer } from "./CustomizerProvider";

/** Minimal structural type for the makeDefault OrbitControls instance. */
interface OrbitControlsLike {
  update: () => void;
}

export type ViewSide = "front" | "back";

interface SceneProps {
  viewSide: ViewSide;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function Scene({ viewSide, onCanvasReady }: SceneProps) {
  const {
    shirtColor,
    assets,
    selectedAssetId,
    selectAsset,
  } = useCustomizer();

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      // preserveDrawingBuffer lets us call canvas.toDataURL() for PNG export.
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      className="!bg-transparent"
      onCreated={({ gl }) => {
        onCanvasReady?.(gl.domElement);
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 0.05, 2.4]} fov={38} />
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <Environment preset="city" />
        <Center>
          <Shirt
            shirtColor={shirtColor}
            assets={assets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={selectAsset}
          />
        </Center>
        <ContactShadows
          position={[0, -0.5, 0]}
          opacity={0.45}
          scale={4}
          blur={2.4}
          far={1.5}
          resolution={512}
          color="#000000"
        />
      </Suspense>
      {/* No polar/azimuth limits: the camera can revolve freely around the
          shirt for full 360° inspection. */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={1.2}
        maxDistance={5}
        autoRotate={false}
        target={[0, 0, 0]}
      />
      <CameraPresetController side={viewSide} />
    </Canvas>
  );
}

const FRONT_CAM = new THREE.Vector3(0, 0.05, 2.4);
const BACK_CAM = new THREE.Vector3(0, 0.05, -2.4);

/**
 * Smoothly flies the default OrbitControls camera between the front and back
 * views whenever the side preset changes. Free orbit remains available at all
 * other times.
 */
function CameraPresetController({ side }: { side: ViewSide }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsLike | null;
  const target = useRef(new THREE.Vector3());
  const animating = useRef(false);

  useEffect(() => {
    target.current.copy(side === "front" ? FRONT_CAM : BACK_CAM);
    animating.current = true;
  }, [side]);

  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(target.current, 0.18);
    controls?.update();
    if (camera.position.distanceTo(target.current) < 0.01) {
      camera.position.copy(target.current);
      controls?.update();
      animating.current = false;
    }
  });

  return null;
}

// Keep a ref helper exported so callers can type the canvas element.
export type CanvasRef = MutableRefObject<HTMLCanvasElement | null>;