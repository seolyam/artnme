export type ByteRange = { start: number; end: number };

/**
 * Reads an HTTP Range header ("bytes=0-", "bytes=100-199", "bytes=-500") for a
 * file of `size` bytes. Returns the inclusive span to send, "unsatisfiable"
 * for a 416, or null when there is no usable range and the whole file should
 * be sent. Spans are capped at `maxChunk` bytes, so a video player asking for
 * "everything from here" gets one part and requests the next itself. Only the
 * first of several ranges is honoured.
 */
export function parseByteRange(
  header: string | null,
  size: number,
  maxChunk = Infinity,
): ByteRange | "unsatisfiable" | null {
  const m = header?.match(/^bytes=(\d*)-(\d*)/);
  if (!m || (m[1] === "" && m[2] === "")) return null;

  let start: number;
  let end: number;
  if (m[1] === "") {
    // Suffix range: the last N bytes.
    const n = Number(m[2]);
    if (n === 0 || size === 0) return "unsatisfiable";
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(m[1]);
    // A backwards range is malformed, which means "ignore the header".
    if (m[2] !== "" && Number(m[2]) < start) return null;
    if (start >= size) return "unsatisfiable";
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  return { start, end: Math.min(end, start + maxChunk - 1) };
}
