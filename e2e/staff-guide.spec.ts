import { expect, test } from "@playwright/test";

/** The staff video guide plays from the sidebar and is never served to signed-out visitors. */
const VIDEO = "/api/staff-guide/staff-portal-guide.mp4";

test("the sidebar's Video guide plays the walkthrough", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /Video guide/ }).click();
  const dialog = page.getByRole("dialog", { name: "How to use the staff portal" });
  await expect(dialog).toBeVisible();
  const video = dialog.locator("video");
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.duration), { timeout: 20_000 })
    .toBeGreaterThan(60);
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
});

test("the video is sent in parts the player can seek through", async ({ page }) => {
  const res = await page.request.get(VIDEO, { headers: { Range: "bytes=0-" } });
  expect(res.status()).toBe(206);
  expect(res.headers()["content-type"]).toBe("video/mp4");
  expect(res.headers()["content-range"]).toMatch(/^bytes 0-4194303\/\d+$/);

  const size = Number(res.headers()["content-range"].split("/")[1]);
  const tail = await page.request.get(VIDEO, { headers: { Range: `bytes=${size - 10}-` } });
  expect(tail.status()).toBe(206);
  expect((await tail.body()).length).toBe(10);

  expect((await page.request.get(VIDEO, { headers: { Range: `bytes=${size}-` } })).status()).toBe(416);
  expect((await page.request.get("/api/staff-guide/secret.txt")).status()).toBe(404);
});

test.describe("signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the video and poster redirect to the login page", async ({ request }) => {
    for (const path of [VIDEO, "/api/staff-guide/staff-portal-guide.jpg"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(307);
      expect(res.headers().location).toContain("/login");
    }
  });
});
