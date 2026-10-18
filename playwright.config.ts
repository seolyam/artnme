import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for the staff portal.
 *
 *   pnpm build && pnpm test:e2e
 *
 * Signs in with E2E_EMAIL / E2E_PASSWORD (falls back to ADMIN_EMAIL /
 * ADMIN_PASSWORD from .env.local). The account must be an admin so the suite
 * can purge its throwaway order afterwards. Everything it creates is named
 * "E2E Test …" and deleted at the end.
 *
 * Set E2E_BASE_URL to test a running server; otherwise `next start` is
 * launched on port 3100 (run `pnpm build` first).
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "portal",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/staff.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm start --port 3100",
        url: `${baseURL}/login`,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
