import { describe, expect, it } from "vitest";
import { parseByteRange } from "./byte-range";

describe("parseByteRange", () => {
  it("sends the whole file when there is no usable range", () => {
    expect(parseByteRange(null, 10)).toBeNull();
    expect(parseByteRange("items=0-1", 10)).toBeNull();
    expect(parseByteRange("bytes=-", 10)).toBeNull();
    expect(parseByteRange("bytes=5-2", 10)).toBeNull();
  });

  it("reads open, closed and suffix ranges", () => {
    expect(parseByteRange("bytes=0-", 10)).toEqual({ start: 0, end: 9 });
    expect(parseByteRange("bytes=0-1", 10)).toEqual({ start: 0, end: 1 });
    expect(parseByteRange("bytes=2-5", 10)).toEqual({ start: 2, end: 5 });
    expect(parseByteRange("bytes=-3", 10)).toEqual({ start: 7, end: 9 });
  });

  it("clamps past the end of the file", () => {
    expect(parseByteRange("bytes=8-100", 10)).toEqual({ start: 8, end: 9 });
    expect(parseByteRange("bytes=-30", 10)).toEqual({ start: 0, end: 9 });
  });

  it("caps each part at maxChunk", () => {
    expect(parseByteRange("bytes=0-", 10, 4)).toEqual({ start: 0, end: 3 });
    expect(parseByteRange("bytes=8-", 10, 4)).toEqual({ start: 8, end: 9 });
    expect(parseByteRange("bytes=-6", 10, 4)).toEqual({ start: 4, end: 7 });
  });

  it("uses the first of several ranges", () => {
    expect(parseByteRange("bytes=0-1, 4-5", 10)).toEqual({ start: 0, end: 1 });
  });

  it("rejects ranges that start past the end", () => {
    expect(parseByteRange("bytes=10-", 10)).toBe("unsatisfiable");
    expect(parseByteRange("bytes=-0", 10)).toBe("unsatisfiable");
    expect(parseByteRange("bytes=-5", 0)).toBe("unsatisfiable");
  });
});
