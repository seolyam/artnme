import { describe, expect, it } from "vitest";
import { cloudinaryPreviewUrl } from "./preview";

const BASE = "https://res.cloudinary.com/demo/image/upload/v1712345678/quotes/logo.png";

describe("cloudinaryPreviewUrl", () => {
  it("asks Cloudinary for a JPEG no bigger than 1024 px", () => {
    expect(cloudinaryPreviewUrl(BASE)).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_1024,h_1024,c_limit,f_jpg/v1712345678/quotes/logo.png",
    );
  });

  it("rasterizes the first page of a PDF", () => {
    expect(cloudinaryPreviewUrl(BASE.replace(".png", ".pdf"), { pdf: true })).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_1024,h_1024,c_limit,f_jpg,pg_1/v1712345678/quotes/logo.pdf",
    );
  });

  it("refuses anything that isn't a Cloudinary image URL", () => {
    expect(cloudinaryPreviewUrl("https://evil.example.com/image/upload/x.png")).toBeNull();
    expect(cloudinaryPreviewUrl("http://res.cloudinary.com/demo/image/upload/x.png")).toBeNull();
    expect(cloudinaryPreviewUrl("https://res.cloudinary.com/demo/raw/upload/v1/file.pdf")).toBeNull();
    expect(cloudinaryPreviewUrl("not a url")).toBeNull();
  });
});
