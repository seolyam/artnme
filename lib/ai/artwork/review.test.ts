import { describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { reviewArtwork } from "./review";

function modelReturning(output: unknown) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(output) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 1500, noCache: 1500, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 120, text: 120, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

const IMAGE = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

const OUTPUT = {
  printableAsIs: false,
  issues: [
    { code: "watermark", severity: "warn", note: "Stock photo watermark across the middle." },
    { code: "third_party_logo", severity: "info", note: "Looks like a pro team's logo." },
    { code: "low_detail", severity: "warn", note: "Edges are soft." },
  ],
  summary: "Watermarked stock image.",
};

describe("reviewArtwork", () => {
  it("sends the image as a file part with the product named in the text", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const model = modelReturning(OUTPUT);
    await reviewArtwork({ image: IMAGE, mediaType: "image/jpeg", productType: "T-Shirt", audience: "staff", model });
    const user = model.doGenerateCalls[0].prompt.find((m) => m.role === "user");
    const parts = user && Array.isArray(user.content) ? user.content : [];
    expect(parts.some((p) => p.type === "file" && p.mediaType.startsWith("image/"))).toBe(true);
    expect(JSON.stringify(parts)).toContain("T-Shirt");
  });

  it("keeps brand-logo notes for staff", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await reviewArtwork({
      image: IMAGE,
      mediaType: "image/jpeg",
      productType: "T-Shirt",
      audience: "staff",
      model: modelReturning(OUTPUT),
    });
    expect(res.ok && res.review.issues.map((i) => i.code)).toContain("third_party_logo");
  });

  it("never shows brand-logo notes to customers", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await reviewArtwork({
      image: IMAGE,
      mediaType: "image/jpeg",
      productType: "T-Shirt",
      audience: "customer",
      model: modelReturning(OUTPUT),
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.review.issues.map((i) => i.code)).toEqual(["watermark", "low_detail"]);
    expect(JSON.stringify(res.review)).not.toMatch(/team's logo/);
  });

  it("keeps at most 5 issues, warnings first", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const many = {
      ...OUTPUT,
      issues: [
        ...Array.from({ length: 4 }, () => ({ code: "near_edge", severity: "info", note: "close to edge" })),
        ...Array.from({ length: 3 }, () => ({ code: "low_detail", severity: "warn", note: "soft" })),
      ],
    };
    const res = await reviewArtwork({
      image: IMAGE,
      mediaType: "image/jpeg",
      productType: "Mug",
      audience: "staff",
      model: modelReturning(many),
    });
    expect(res.ok && res.review.issues).toHaveLength(5);
    expect(res.ok && res.review.issues.slice(0, 3).every((i) => i.severity === "warn")).toBe(true);
  });

  it("passes failures through", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await reviewArtwork({
      image: IMAGE,
      mediaType: "image/jpeg",
      productType: "Mug",
      audience: "staff",
      model: modelReturning({ wrong: true }),
    });
    expect(res).toEqual({ ok: false, reason: "invalid" });
  });
});
