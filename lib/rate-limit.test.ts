import { describe, expect, it } from "vitest";
import { createThrottle } from "./rate-limit";

function clock(start = 1_000_000) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("createThrottle", () => {
  it("allows up to max hits in the window, then blocks", () => {
    const c = clock();
    const throttle = createThrottle({ windowMs: 1000, max: 3, now: c.now });
    expect(throttle.hit("a")).toBe(false);
    expect(throttle.hit("a")).toBe(false);
    expect(throttle.hit("a")).toBe(false);
    expect(throttle.hit("a")).toBe(true);
    expect(throttle.hit("a")).toBe(true);
  });

  it("lets hits through again once the window has passed", () => {
    const c = clock();
    const throttle = createThrottle({ windowMs: 1000, max: 2, now: c.now });
    throttle.hit("a");
    c.advance(500);
    throttle.hit("a");
    expect(throttle.hit("a")).toBe(true);

    // The first hit expires at exactly windowMs; one slot frees up.
    c.advance(500);
    expect(throttle.hit("a")).toBe(false);
    expect(throttle.hit("a")).toBe(true);

    c.advance(1000);
    expect(throttle.hit("a")).toBe(false);
  });

  it("does not count blocked hits toward the limit", () => {
    const c = clock();
    const throttle = createThrottle({ windowMs: 1000, max: 1, now: c.now });
    throttle.hit("a");
    c.advance(900);
    expect(throttle.hit("a")).toBe(true);
    c.advance(100);
    expect(throttle.hit("a")).toBe(false);
  });

  it("keeps keys separate", () => {
    const c = clock();
    const throttle = createThrottle({ windowMs: 1000, max: 1, now: c.now });
    expect(throttle.hit("a")).toBe(false);
    expect(throttle.hit("a")).toBe(true);
    expect(throttle.hit("b")).toBe(false);
  });

  it("keeps separate throttles separate", () => {
    const c = clock();
    const one = createThrottle({ windowMs: 1000, max: 1, now: c.now });
    const two = createThrottle({ windowMs: 1000, max: 1, now: c.now });
    one.hit("a");
    expect(two.hit("a")).toBe(false);
  });
});
