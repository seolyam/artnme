// One real AI Gateway call to check the key, model and logging end to end.
// Run: pnpm exec dotenv -e .env.local -- tsx scripts/ai-smoke.ts
// Costs a fraction of a cent; shows up tagged feature:smoke in the gateway dashboard.

import { z } from "zod/v4";
import { runStructured } from "../lib/ai/call";
import { MODELS, estimateCostUsd } from "../lib/ai/models";

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    console.error("No AI_GATEWAY_API_KEY (or VERCEL_OIDC_TOKEN) in the environment. Add it to .env.local.");
    process.exit(1);
  }

  const res = await runStructured({
    feature: "smoke",
    instructions: "Extract the order details from the customer's message.",
    prompt: "Hi! Pwede ko maka-order 50 ka white shirts nga may print sa likod? Kinahanglan namon sa Biyernes.",
    schema: z.object({
      productType: z.string(),
      quantity: z.number().int(),
      language: z.string(),
    }),
  });

  if (!res.ok) {
    console.error(`Smoke call failed: ${res.reason}`);
    process.exit(1);
  }
  console.log("output:", res.output);
  console.log("usage:", res.usage, `ms=${res.ms}`);
  console.log(`estimated cost: $${estimateCostUsd(MODELS.primary, res.usage).toFixed(6)}`);
}

main();
