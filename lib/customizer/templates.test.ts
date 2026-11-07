import { describe, expect, it } from "vitest";
import { SHIRT_TEMPLATES, initialsOf, piecePose, templateDefaults, templateOnShirt } from "./templates";

/** Printable region of /images/shirt.glb (see CustomizerProvider's PLACEMENT_BOUNDS), with a little bleed. */
const PRINTABLE = { x: 0.3, yMin: 0.95, yMax: 1.66 };
const STOCK_BLANKS = ["#FFFFFF", "#0A0A0A", "#1B2A4A", "#B31218", "#9B9B9B", "#4A5320", "#B8B5B0", "#C9A227"];

describe("SHIRT_TEMPLATES", () => {
  it("has a handful of templates with unique ids on stock blank colors", () => {
    expect(SHIRT_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    expect(new Set(SHIRT_TEMPLATES.map((t) => t.id)).size).toBe(SHIRT_TEMPLATES.length);
    for (const t of SHIRT_TEMPLATES) expect(STOCK_BLANKS).toContain(t.shirtColor);
  });

  it("every field has a label and a sample value that fits its limit", () => {
    for (const t of SHIRT_TEMPLATES) {
      expect(t.fields.length).toBeGreaterThan(0);
      for (const f of t.fields) {
        expect(f.label.length).toBeGreaterThan(0);
        expect(f.sample.length).toBeLessThanOrEqual(f.maxLength);
      }
    }
  });

  it("every printed piece sits inside the printable area of the shirt", () => {
    for (const t of SHIRT_TEMPLATES) {
      for (const p of t.pieces) {
        const x = p.x ?? 0;
        expect(Math.abs(x) + p.width / 2, `${t.id}/${p.id} width`).toBeLessThanOrEqual(PRINTABLE.x);
        expect(p.y - p.height / 2, `${t.id}/${p.id} bottom`).toBeGreaterThanOrEqual(PRINTABLE.yMin);
        expect(p.y + p.height / 2, `${t.id}/${p.id} top`).toBeLessThanOrEqual(PRINTABLE.yMax);
      }
    }
  });
});

describe("piecePose", () => {
  it("puts front pieces on the chest facing forward", () => {
    const pose = piecePose({ placement: "front", y: 1.4, width: 0.4, height: 0.2 });
    expect(pose.position).toEqual([0, 1.4, 0.14]);
    expect(pose.rotation).toEqual([0, 0, 0]);
    expect(pose.scale).toEqual([0.4, 0.2, 0.4]);
  });

  it("turns back pieces around so the words read correctly from behind", () => {
    const pose = piecePose({ placement: "back", x: 0.1, y: 1.3, width: 0.3, height: 0.4 });
    expect(pose.position).toEqual([0.1, 1.3, -0.14]);
    expect(pose.rotation).toEqual([0, Math.PI, 0]);
  });
});

describe("templateDefaults", () => {
  it("starts every field with its sample so the preview looks finished", () => {
    const t = SHIRT_TEMPLATES[0];
    const values = templateDefaults(t);
    for (const f of t.fields) expect(values[f.key]).toBe(f.sample);
  });
});

describe("templateOnShirt", () => {
  it("finds the template behind the layers and the words it was made with", () => {
    const values = { team: "Sharks", surname: "Cruz", number: "7" };
    const found = templateOnShirt([
      {}, // an uploaded image or typed text layer
      { template: { id: "team-jersey", piece: "front", values } },
      { template: { id: "team-jersey", piece: "back", values } },
    ]);
    expect(found?.template.id).toBe("team-jersey");
    expect(found?.values).toEqual(values);
  });

  it("is null for designs not made from a template, or from one that no longer exists", () => {
    expect(templateOnShirt([{}])).toBeNull();
    expect(templateOnShirt([{ template: { id: "retired", piece: "front", values: {} } }])).toBeNull();
  });

  it("fills in fields added to a template after the layers were made", () => {
    const found = templateOnShirt([{ template: { id: "team-jersey", piece: "front", values: { team: "Sharks" } } }]);
    expect(found?.values).toMatchObject({ team: "Sharks", surname: "Dela Cruz", number: "10" });
  });
});

describe("initialsOf", () => {
  it("takes up to three initials, skipping small words", () => {
    expect(initialsOf("Youth Council of Silay")).toBe("YCS");
    expect(initialsOf("the art and design club")).toBe("ADC");
    expect(initialsOf("Rotary")).toBe("R");
    expect(initialsOf("   ")).toBe("");
  });
});
