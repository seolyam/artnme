import { describe, expect, it } from "vitest";
import { SHIRT_TEMPLATES } from "./templates";
import { buildBriefSchema, clampBrief, type BriefOutput } from "./brief";

const schema = buildBriefSchema(SHIRT_TEMPLATES);

function brief(over: Partial<BriefOutput>): BriefOutput {
  return {
    templateId: "family-reunion",
    values: [],
    shirtColor: "Navy",
    reason: "A family reunion.",
    ...over,
  };
}

describe("buildBriefSchema", () => {
  it("only accepts template ids from the registry", () => {
    expect(schema.safeParse(brief({ templateId: "family-reunion" })).success).toBe(true);
    expect(schema.safeParse(brief({ templateId: "made-up" as never })).success).toBe(false);
  });

  it("only accepts shirt colors from the swatch list", () => {
    expect(schema.safeParse(brief({ shirtColor: "Purple" as never })).success).toBe(false);
  });
});

describe("clampBrief", () => {
  it("maps the color name to its hex and keeps the template", () => {
    const r = clampBrief(brief({ values: [{ key: "family", value: "Dela Cruz" }] }));
    expect(r.template.id).toBe("family-reunion");
    expect(r.shirtColor).toBe("#1B2A4A");
    expect(r.values.family).toBe("Dela Cruz");
  });

  it("drops keys the template doesn't have", () => {
    const r = clampBrief(brief({ values: [{ key: "family", value: "Reyes" }, { key: "secret", value: "x" }] }));
    expect(r.values).not.toHaveProperty("secret");
  });

  it("cuts values to each field's max length", () => {
    const r = clampBrief(brief({ values: [{ key: "family", value: "A".repeat(60) }] }));
    expect(r.values.family).toHaveLength(22);
  });

  it("keeps only digits in numeric fields", () => {
    const r = clampBrief(brief({ values: [{ key: "year", value: "Dec 2026" }] }));
    expect(r.values.year).toBe("2026");
  });

  it("fills a missing required field from the template sample, but leaves optional ones empty", () => {
    const r = clampBrief(brief({ values: [{ key: "year", value: "2026" }] }));
    expect(r.values.family).toBe("Reyes");
    expect(r.values.place).toBe("");
  });

  it("trims the reason", () => {
    expect(clampBrief(brief({ reason: "x".repeat(300) })).reason.length).toBeLessThanOrEqual(140);
  });
});
