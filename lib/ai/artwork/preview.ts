// Small previews of stored artwork for the vision model: Cloudinary resizes
// (and rasterizes PDFs) on the fly, so a 20 MB photo costs the same as a thumbnail.

const MAX_BYTES = 2 * 1024 * 1024;

/** A ≤1024px JPEG of a Cloudinary image (page 1 for a PDF), or null for
 *  anything that isn't one of our Cloudinary image URLs. */
export function cloudinaryPreviewUrl(url: string, { pdf = false } = {}): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  // Only fetch from Cloudinary over https: the URL comes from our own DB, but
  // this keeps a bad row from turning into a request to an arbitrary host.
  if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") return null;
  const marker = "/image/upload/";
  const at = parsed.pathname.indexOf(marker);
  if (at < 0) return null;
  const transform = `w_1024,h_1024,c_limit,f_jpg${pdf ? ",pg_1" : ""}/`;
  parsed.pathname = parsed.pathname.slice(0, at + marker.length) + transform + parsed.pathname.slice(at + marker.length);
  return parsed.toString();
}

/** GET with a 10 s timeout and a 2 MB cap; null on any failure. */
export async function fetchCapped(url: string, maxBytes = MAX_BYTES): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok || !res.body) return null;
    if (Number(res.headers.get("content-length") ?? 0) > maxBytes) return null;
    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.byteLength;
    }
    return out;
  } catch {
    return null;
  }
}
