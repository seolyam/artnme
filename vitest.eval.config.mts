import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Live-model evals (`pnpm eval`). Kept apart from `pnpm test`, which stays
// offline and free.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.eval.ts"],
    environment: "node",
    env: { TZ: "America/New_York" },
    testTimeout: 600_000,
    // One eval file at a time: they share the model's per-minute rate limit.
    fileParallelism: false,
  },
});
