import type { LanguageModel } from "ai";
import { briefInstructions, buildBriefSchema, clampBrief } from "@/lib/customizer/brief";
import { runStructured, type AiFailure } from "./call";

const schema = buildBriefSchema();

export type StudioBriefResult =
  | { ok: true; templateId: string; values: Record<string, string>; shirtColor: string; reason: string }
  | { ok: false; reason: AiFailure };

/** A customer's event description → a template, its words and a shirt color. */
export async function draftStudioBrief(
  text: string,
  opts: { model?: LanguageModel; fallback?: boolean } = {},
): Promise<StudioBriefResult> {
  const res = await runStructured({
    model: opts.model,
    fallback: opts.fallback,
    feature: "studio-brief",
    instructions: briefInstructions(),
    prompt: `<description>\n${text}\n</description>`,
    schema,
  });
  if (!res.ok) return res;
  const brief = clampBrief(res.output);
  return { ok: true, templateId: brief.template.id, values: brief.values, shirtColor: brief.shirtColor, reason: brief.reason };
}
