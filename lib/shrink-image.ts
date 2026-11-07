import { MAX_IMAGE_EDGE, MAX_UPLOAD_BYTES, TOO_BIG_MESSAGE, canShrink, fitWithin, shrunkName } from "@/lib/upload";

/**
 * Browser-only. Gets a file ready to send: small files pass through, large
 * photos are redrawn smaller until they fit MAX_UPLOAD_BYTES, and anything
 * else that's too big (a PDF, an SVG) comes back as a message to show.
 */
export async function shrinkForUpload(file: File): Promise<{ file: File } | { error: string }> {
  if (file.size <= MAX_UPLOAD_BYTES) return { file };
  if (!canShrink(file.type)) return { error: TOO_BIG_MESSAGE };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { error: TOO_BIG_MESSAGE };
  }

  try {
    // PNGs (often logos with a transparent background) stay PNG while they can;
    // photos, and PNGs that won't fit, become JPEG, which is far smaller.
    const attempts: [number, string][] = [
      ...(file.type === "image/png" ? ([[MAX_IMAGE_EDGE, "image/png"], [2000, "image/png"]] as [number, string][]) : []),
      [MAX_IMAGE_EDGE, "image/jpeg"],
      [2400, "image/jpeg"],
      [1800, "image/jpeg"],
    ];
    for (const [edge, type] of attempts) {
      const blob = await draw(bitmap, edge, type);
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        return { file: new File([blob], shrunkName(file.name, type), { type, lastModified: file.lastModified }) };
      }
    }
    return { error: TOO_BIG_MESSAGE };
  } finally {
    bitmap.close();
  }
}

function draw(bitmap: ImageBitmap, edge: number, type: string): Promise<Blob | null> {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, edge);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  if (type === "image/jpeg") {
    // JPEG has no transparency; give see-through areas a white background instead of black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.86));
}
