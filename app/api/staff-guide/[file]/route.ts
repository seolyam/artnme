import fs from "node:fs";
import { open, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { parseByteRange } from "@/lib/byte-range";

export const dynamic = "force-dynamic";

/**
 * The staff portal video guide. Kept out of public/ because it films the live
 * portal (dashboards, takings, customer names), so only signed-in staff get it.
 * The files ship with the server via outputFileTracingIncludes in next.config.
 */
const FILES: Record<string, string> = {
  "staff-portal-guide.mp4": "video/mp4",
  "staff-portal-guide.jpg": "image/jpeg",
};
const DIR = path.join(process.cwd(), "private", "videos");
/** Stays under Vercel's 4.5 MB response cap; the player fetches the next part itself. */
const MAX_CHUNK = 4 * 1024 * 1024;

async function readSlice(file: string, start: number, end: number) {
  const handle = await open(file);
  try {
    const buf = Buffer.alloc(end - start + 1);
    await handle.read(buf, 0, buf.length, start);
    return buf;
  } finally {
    await handle.close();
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  await requireAuth();
  const { file } = await params;
  const type = Object.hasOwn(FILES, file) ? FILES[file] : undefined;
  if (!type) return new Response("Not found", { status: 404 });

  const filePath = path.join(DIR, file);
  const { size } = await stat(filePath);
  const headers = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "Content-Type": type,
  };

  const range = parseByteRange(request.headers.get("range"), size, MAX_CHUNK);
  if (range === "unsatisfiable") {
    return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
  }
  if (!range) {
    const body = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream<Uint8Array>;
    return new Response(body, { headers: { ...headers, "Content-Length": String(size) } });
  }
  return new Response(await readSlice(filePath, range.start, range.end), {
    status: 206,
    headers: {
      ...headers,
      "Content-Length": String(range.end - range.start + 1),
      "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
    },
  });
}
