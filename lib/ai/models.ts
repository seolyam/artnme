// The only place model IDs live. Prices are USD per 1M tokens from
// https://ai-gateway.vercel.sh/v1/models (checked 2026-11-08), used for cost
// estimates in logs and evals, never for billing.

// The team is on the AI Gateway free tier (checked 2026-11-08): only some
// models are allowed (Haiku 5.5, Gemini 3.x and GPT-6 Luna return 403) and each
// model is limited to 5 requests per minute. Free-tier models that answered:
// gemini-2.5-flash-lite, gemini-2.5-flash, gpt-5-nano, gpt-4.1-nano,
// ministral-14b, nova-lite. The pair was picked by `pnpm eval` (results in
// lib/ai/evals/results): Flash-Lite met every target at ~$0.0002 a draft;
// Flash also passes (slower, pricier) and has its own rate-limit bucket.
// gpt-4.1-nano missed the quantity target and gpt-5-nano (a reasoning model)
// timed out, so the fallback stays on Google despite the shared provider.
export const MODELS = {
  primary: "google/gemini-2.5-flash-lite",
  fallback: "google/gemini-2.5-flash",
} as const;

export const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  "google/gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  "google/gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "openai/gpt-5-nano": { input: 0.05, output: 0.4 },
  "openai/gpt-4.1-nano": { input: 0.1, output: 0.4 },
  "mistral/ministral-14b": { input: 0.2, output: 0.2 },
  "amazon/nova-lite": { input: 0.06, output: 0.24 },
  "anthropic/claude-haiku-5.5": { input: 0.1, output: 0.5 },
};

/** Estimated USD cost of one call; 0 for models without a listed price. */
export function estimateCostUsd(
  modelId: string,
  usage: { inputTokens: number; outputTokens: number },
): number {
  const price = MODEL_PRICES[modelId];
  if (!price) return 0;
  return (usage.inputTokens * price.input + usage.outputTokens * price.output) / 1_000_000;
}

/** AI Gateway provider options shared by every call: a different-provider
 *  fallback, a per-feature tag for spend reports, and no prompt training.
 *  Evals turn the fallback off so they measure one model. */
export function gatewayOptions({ feature, user, fallback = true }: { feature: string; user?: string; fallback?: boolean }) {
  return {
    gateway: {
      ...(fallback ? { models: [MODELS.fallback] } : {}),
      tags: [`feature:${feature}`],
      ...(user ? { user } : {}),
      disallowPromptTraining: true,
    },
  };
}
