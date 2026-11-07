import { describe, expect, it } from "vitest";
import { dataUrlToFile } from "./handoff";

describe("dataUrlToFile", () => {
  it("turns the studio's PNG data URL back into a file the quote form can send", async () => {
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const dataUrl = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
    const file = dataUrlToFile(dataUrl, "mockup.png");
    expect(file).not.toBeNull();
    expect(file!.name).toBe("mockup.png");
    expect(file!.type).toBe("image/png");
    expect(new Uint8Array(await file!.arrayBuffer())).toEqual(bytes);
  });

  it("refuses anything that isn't a base64 image", () => {
    expect(dataUrlToFile("not a data url", "x.png")).toBeNull();
    expect(dataUrlToFile("data:text/html;base64,PGgxPg==", "x.png")).toBeNull();
  });
});
