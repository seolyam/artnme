/**
 * File upload limits shared by the quote form and the staff order files.
 *
 * Vercel turns away any request body over 4.5 MB before our server code runs,
 * so a bigger file never reaches the server's own size check; the browser just
 * gets an error. Files are kept under this limit in the browser instead:
 * photos are shrunk (see shrinkForUpload), anything else that's too big gets
 * a plain message. Safe to import on the server and in the browser.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "4 MB";
/** Longest side, in pixels, of a shrunk photo: still sharp enough for print references and proofs. */
export const MAX_IMAGE_EDGE = 3000;

export const TOO_BIG_MESSAGE = `That file is over ${MAX_UPLOAD_LABEL}. Send a smaller one, or message it to us on Facebook.`;

/** Formats a canvas can decode and re-encode without losing anything that matters. */
export function canShrink(type: string) {
  return /^image\/(jpeg|png|webp)$/.test(type);
}

export function fitWithin(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** File name after shrinking: a photo re-encoded as JPEG gets a .jpg ending. */
export function shrunkName(name: string, type: string) {
  if (type !== "image/jpeg") return name;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.jpg`;
}
