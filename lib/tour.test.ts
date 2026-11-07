import { describe, expect, it } from "vitest";
import { TOUR_STEPS, holeFor, nextAfterNavigation, placeCard } from "./tour";

const viewport = { width: 1280, height: 800 };
const card = { width: 400, height: 220 };

describe("placeCard", () => {
  it("centers the card when there is nothing to point at", () => {
    expect(placeCard(null, card, viewport)).toEqual({ top: 290, left: 440, side: "center" });
  });

  it("goes below the target when it fits, centered on it", () => {
    const pos = placeCard({ top: 100, left: 500, width: 200, height: 60 }, card, viewport);
    expect(pos).toEqual({ top: 176, left: 400, side: "below" });
  });

  it("goes above the target when there is no room below", () => {
    const pos = placeCard({ top: 600, left: 500, width: 200, height: 100 }, card, viewport);
    expect(pos).toEqual({ top: 364, left: 400, side: "above" });
  });

  it("docks at the bottom of the screen when the target is too tall for either side", () => {
    const pos = placeCard({ top: 100, left: 0, width: 1280, height: 600 }, card, viewport);
    expect(pos.side).toBe("bottom");
    expect(pos.top).toBe(800 - 220 - 16);
  });

  it("keeps the card inside the screen edges", () => {
    expect(placeCard({ top: 100, left: 1200, width: 60, height: 40 }, card, viewport).left).toBe(864);
    expect(placeCard({ top: 100, left: 0, width: 40, height: 40 }, card, viewport).left).toBe(16);
  });

  it("uses the side margin on phones narrower than the card", () => {
    const phone = { width: 360, height: 700 };
    const pos = placeCard({ top: 100, left: 40, width: 200, height: 60 }, { width: 328, height: 240 }, phone);
    expect(pos.left).toBe(16);
  });
});

describe("holeFor", () => {
  it("pads the target and clamps the hole to the screen", () => {
    expect(holeFor({ top: 100, left: 100, width: 200, height: 50 }, viewport)).toEqual({
      top: 92,
      left: 92,
      width: 216,
      height: 66,
    });
    expect(holeFor({ top: 2, left: 1270, width: 40, height: 20 }, viewport)).toEqual({
      top: 0,
      left: 1262,
      width: 18,
      height: 30,
    });
  });
});

describe("nextAfterNavigation", () => {
  const quoteStep = TOUR_STEPS.findIndex((s) => s.path === "/quote");

  it("stays on the step when the page already matches", () => {
    expect(nextAfterNavigation(0, "/")).toBe(0);
  });

  it("moves on when the customer follows the highlighted link themselves", () => {
    expect(nextAfterNavigation(quoteStep - 1, "/quote")).toBe(quoteStep);
  });

  it("ends the tour when the customer wanders to an unrelated page", () => {
    expect(nextAfterNavigation(0, "/portfolio")).toBeNull();
  });
});

describe("TOUR_STEPS", () => {
  it("every step names a page and at least one element to point at", () => {
    for (const step of TOUR_STEPS) {
      expect(step.path.startsWith("/")).toBe(true);
      expect(step.targets.length).toBeGreaterThan(0);
      expect(step.title.length).toBeGreaterThan(0);
    }
  });
});
