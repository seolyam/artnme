import * as THREE from "three";

/**
 * Minimal structural type describing the parts of the R3F runtime we need to
 * drive a programmatic multi-angle capture. Populated by R3FStateBridge
 * inside the <Canvas> and exposed via CustomizerProvider.
 */
export interface ThreeSnapshot {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: {
    enabled: boolean;
    update: () => void;
    target: THREE.Vector3;
  } | null;
}

/**
 * The four orthographic-style angles used for the mockup sheet. Coordinates are
 * in the shirt model space already used by CameraPresetController (front = +Z).
 */
const VIEW_ANGLES: { label: string; position: [number, number, number] }[] = [
  { label: "Front", position: [0, 0.05, 2.4] },
  { label: "Right", position: [2.4, 0.05, 0] },
  { label: "Back", position: [0, 0.05, -2.4] },
  { label: "Left", position: [-2.4, 0.05, 0] },
];

/** Max cell edge in px when drawing each captured view into the composite. */
const MAX_CELL_EDGE = 1024;
const PAD = 56;
const GAP = 36;
const LABEL_H = 44;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load captured frame"));
    img.src = src;
  });
}

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Grab a WebGL <canvas> (rendered with preserveDrawingBuffer: true) and download
 * the current frame as a high-quality PNG. Returns true on success.
 *
 * Kept for backwards compatibility / single-frame use cases.
 */
export function exportCanvasToPng(
  canvas: HTMLCanvasElement | null,
  filename = "artnme-design.png",
): boolean {
  if (!canvas) return false;
  try {
    triggerDownload(canvas.toDataURL("image/png"), filename);
    return true;
  } catch {
    return false;
  }
}

/**
 * Programmatic multi-angle capture. Steps:
 *  1. Disable OrbitControls and snapshot the user's camera position/quaternion.
 *  2. For each of the four canonical angles, move the camera, force a fresh
 *     WebGL render, and capture the frame to a Base64 PNG via toDataURL().
 *  3. Composite the four frames into a single 2x2 grid on an off-screen 2D
 *     canvas with subtle labels and a soft background.
 *  4. Trigger one browser download for the composite.
 *  5. Restore the camera exactly and re-enable controls.
 *
 * The capture sequence runs synchronously within a single task, so R3F's
 * requestAnimationFrame render loop cannot interleave and overwrite the
 * drawing buffer between our gl.render() and toDataURL() calls.
 */
export async function exportMultiViewPng(
  snap: ThreeSnapshot | null,
  filename = "artnme-shirt-design.png",
): Promise<boolean> {
  if (!snap) return false;
  const { gl, scene, camera, controls } = snap;

  const prevPosition = camera.position.clone();
  const prevQuaternion = camera.quaternion.clone();
  const prevControlsEnabled = controls ? controls.enabled : true;
  if (controls) controls.enabled = false;

  const target = new THREE.Vector3();
  if (controls) target.copy(controls.target);
  else target.set(0, 0, 0);

  const selectionRings: THREE.Object3D[] = [];
  scene.traverse((child) => {
    if (child.name === "selection-ring" && child.visible) {
      selectionRings.push(child);
      child.visible = false;
    }
  });

  const frames: string[] = [];
  try {
    for (const angle of VIEW_ANGLES) {
      camera.position.set(...angle.position);
      camera.up.set(0, 1, 0);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      // Force a fresh render of this exact angle into the WebGL canvas.
      gl.render(scene, camera);
      frames.push(gl.domElement.toDataURL("image/png"));
    }
  } catch {
    restore();
    return false;
  }

  // Snap the live viewer back to the user's view immediately, so the async
  // composite build (below) never shows a frozen/wrong angle on screen.
  restore();

  let composite: string | null = null;
  try {
    composite = await buildCompositeSheet(frames);
  } catch {
    return false;
  }

  triggerDownload(composite, filename);
  return true;

  function restore() {
    selectionRings.forEach((ring) => {
      ring.visible = true;
    });
    camera.position.copy(prevPosition);
    camera.quaternion.copy(prevQuaternion);
    camera.updateMatrixWorld();
    if (controls) {
      controls.enabled = prevControlsEnabled;
      controls.update();
    }
    // Re-render the user's original view so the live canvas snaps back instantly.
    try {
      gl.render(scene, camera);
    } catch {
      /* ignore */
    }
  }
}

async function buildCompositeSheet(frames: string[]): Promise<string> {
  const images = await Promise.all(frames.map(loadImage));

  let cellW = 0;
  let cellH = 0;
  for (const img of images) {
    const scale = Math.min(1, MAX_CELL_EDGE / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    if (w > cellW) cellW = w;
    if (h > cellH) cellH = h;
  }

  const sheetW = PAD * 2 + cellW * 2 + GAP;
  const sheetH = PAD * 2 + (cellH + LABEL_H) * 2 + GAP;

  const sheet = document.createElement("canvas");
  sheet.width = sheetW;
  sheet.height = sheetH;
  const ctx = sheet.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");

  // Soft near-white background so the shirt reads clearly on any viewer.
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, sheetW, sheetH);

  const positions: { x: number; y: number }[] = [
    { x: PAD, y: PAD },
    { x: PAD + cellW + GAP, y: PAD },
    { x: PAD, y: PAD + cellH + LABEL_H + GAP },
    { x: PAD + cellW + GAP, y: PAD + cellH + LABEL_H + GAP },
  ];

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 22px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = "#222222";

  images.forEach((img, i) => {
    const { x, y } = positions[i];
    const scale = Math.min(1, MAX_CELL_EDGE / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const drawX = x + (cellW - w) / 2;
    const drawY = y + (cellH - h) / 2;
    ctx.drawImage(img, drawX, drawY, w, h);
    ctx.fillText(
      VIEW_ANGLES[i].label,
      x + cellW / 2,
      y + cellH + LABEL_H / 2,
    );
  });

  return sheet.toDataURL("image/png");
}