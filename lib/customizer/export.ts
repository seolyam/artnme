/**
 * Grab a WebGL <canvas> (rendered with preserveDrawingBuffer: true) and download
 * the current frame as a high-quality PNG. Returns true on success.
 */
export function exportCanvasToPng(
  canvas: HTMLCanvasElement | null,
  filename = "artnme-design.png",
): boolean {
  if (!canvas) return false;
  try {
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    return false;
  }
}