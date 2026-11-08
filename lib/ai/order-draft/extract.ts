import type { LanguageModel } from "ai";
import type { PricePresetView } from "@/app/actions/prices";
import { shopToday } from "@/lib/time";
import { runStructured, type AiFailure } from "../call";
import { redactContacts, type ExtractedContacts } from "../redact";
import { buildDraftInstructions, buildDraftPrompt } from "./prompt";
import { resolveDraft, type ResolvedDraft } from "./resolve";
import { orderDraftSchema } from "./schema";

export type DraftResult =
  | {
      ok: true;
      draft: ResolvedDraft;
      /** Found and masked before the model call; match customers with these. */
      contacts: ExtractedContacts;
      usage: { inputTokens: number; outputTokens: number };
      ms: number;
      model: string;
    }
  | { ok: false; reason: AiFailure };

/** Chat or quote text → a checked, priced draft order. Never throws. */
export async function draftOrderFromText(
  text: string,
  opts: { presets: PricePresetView[]; now?: Date; model?: LanguageModel; user?: string; fallback?: boolean },
): Promise<DraftResult> {
  const now = opts.now ?? new Date();
  const { text: redacted, contacts } = redactContacts(text);

  const res = await runStructured({
    model: opts.model,
    feature: "order-draft",
    user: opts.user,
    fallback: opts.fallback,
    instructions: buildDraftInstructions({ today: shopToday(now), presets: opts.presets }),
    prompt: buildDraftPrompt(redacted),
    schema: orderDraftSchema,
  });
  if (!res.ok) return res;

  return {
    ok: true,
    draft: resolveDraft(res.output, { presets: opts.presets, now, text: redacted }),
    contacts,
    usage: res.usage,
    ms: res.ms,
    model: res.model,
  };
}
