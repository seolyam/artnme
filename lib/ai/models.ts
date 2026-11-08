// The only place model IDs live. Prices are USD per 1M tokens from
// https://ai-gateway.vercel.sh/v1/models (checked 2026-11-08), used for cost
// estimates in logs and evals, never for billing.

export const MODELS = {
  primary: "anthropic/claude-haiku-5.5",
  fallback: "google/gemini-2.5-flash-lite",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export const MODEL_PRICES: Record<ModelId, { input: number; output: number }> = {
  "anthropic/claude-haiku-5.5": { input: 0.1, output: 0.5 },
  "google/gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
};

/** Estimated USD cost of one call; 0 for models without a listed price. */
export function estimateCostUsd(
  modelId: string,
  usage: { inputTokens: number; outputTokens: number },
): number {
  const price = MODEL_PRICES[modelId as ModelId];
  if (!price) return 0;
  return (usage.inputTokens * price.input + usage.outputTokens * price.output) / 1_000_000;
}

/** AI Gateway provider options shared by every call: a different-provider
 *  fallback, a per-feature tag for spend reports, and no prompt training. */
export function gatewayOptions({ feature, user }: { feature: string; user?: string }) {
  return {
    gateway: {
      models: [MODELS.fallback],
      tags: [`feature:${feature}`],
      ...(user ? { user } : {}),
      disallowPromptTraining: true,
    },
  };
}
