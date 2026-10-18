import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
    // Run as if the machine were in another zone, so nothing passes only
    // because the computer happens to be on Manila time.
    env: { TZ: "America/New_York" },
  },
});
