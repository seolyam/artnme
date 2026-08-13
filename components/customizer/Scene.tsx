"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Center,
  ContactShadows,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import { Shirt } from "./Shirt";
import { useCustomizer } from "./CustomizerProvider";
import type { ThreeSnapshot } from "@/lib/customizer/export";

export type ViewSide = "front" | "back";

interface SceneProps {
  viewSide: ViewSide;
}

export function Scene({ viewSide }: SceneProps) {
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
    >
      <PerspectiveCamera makeDefault position={[0, 0.05, 2.4]} fov={38} />
      <R3FStateBridge />
      <Suspense fallback={null}>
        <ambientLight intensity={0.45} />
        <hemisphereLight args={["#ffffff", "#888888", 0.35]} />
        <directionalLight
          position={[3, 4, 2]}
          intensity={1.1}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-3, 2.5, 1.5]} intensity={0.45} />
        <directionalLight position={[0, 3, -3]} intensity={0.55} />
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

/**
 * Invisible component that bridges the live R3F runtime objects (renderer,
 * scene, camera, and the makeDefault OrbitControls) into a ref exposed via
 * CustomizerProvider, so the Export button can drive programmatic captures
 * from outside the <Canvas> tree.
 */
function R3FStateBridge() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as
    | (ThreeSnapshot["controls"] & object)
    | null;
  const { threeRef } = useCustomizer();

  useEffect(() => {
    threeRef.current = { gl, scene, camera, controls };
    return () => {
      if (threeRef.current?.camera === camera) threeRef.current = null;
    };
  }, [gl, scene, camera, controls, threeRef]);

  return null;
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
  const controls = useThree((s) => s.controls);
  const target = useRef(new THREE.Vector3());
  const animating = useRef(false);

  useEffect(() => {
    target.current.copy(side === "front" ? FRONT_CAM : BACK_CAM);
    animating.current = true;
  }, [side]);

  useFrame(() => {
    if (!animating.current) return;
    const ctrl = controls as { update: () => void } | null;
    camera.position.lerp(target.current, 0.18);
    ctrl?.update();
    if (camera.position.distanceTo(target.current) < 0.01) {
      camera.position.copy(target.current);
      ctrl?.update();
      animating.current = false;
    }
  });

  return null;
}