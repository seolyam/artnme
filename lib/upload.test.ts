import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, canShrink, fitWithin, shrunkName } from "./upload";

describe("upload limits", () => {
  it("stays under Vercel's 4.5 MB request limit with room for the other form fields", () => {
    expect(MAX_UPLOAD_BYTES).toBeLessThanOrEqual(4.5 * 1024 * 1024 - 256 * 1024);
  });

  it("only shrinks photo formats a canvas can redraw", () => {
    expect(canShrink("image/jpeg")).toBe(true);
    expect(canShrink("image/png")).toBe(true);
    expect(canShrink("image/webp")).toBe(true);
    expect(canShrink("application/pdf")).toBe(false);
    expect(canShrink("image/svg+xml")).toBe(false);
    expect(canShrink("image/gif")).toBe(false);
  });

  it("scales the longest side down to the limit and keeps the shape", () => {
    expect(fitWithin(6000, 4000, 3000)).toEqual({ width: 3000, height: 2000 });
    expect(fitWithin(3000, 4500, 3000)).toEqual({ width: 2000, height: 3000 });
    expect(fitWithin(1200, 800, 3000)).toEqual({ width: 1200, height: 800 });
  });

  it("renames a photo that was re-encoded as JPEG", () => {
    expect(shrunkName("IMG_2041.HEIC.png", "image/jpeg")).toBe("IMG_2041.HEIC.jpg");
    expect(shrunkName("logo.png", "image/png")).toBe("logo.png");
    expect(shrunkName("scan", "image/jpeg")).toBe("scan.jpg");
  });
});
