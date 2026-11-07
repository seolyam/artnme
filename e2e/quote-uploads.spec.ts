import { expect, test, type Page } from "@playwright/test";

/**
 * Attachments on the quote form. Vercel refuses request bodies over 4.5 MB, so
 * big photos must be shrunk in the browser and other big files stopped there.
 * Server-action requests are intercepted, so nothing is actually submitted.
 */

const LIMIT = 4.5 * 1024 * 1024;

// Not a first visit: keep the welcome popup from covering the form.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("artnme_tour_offered", "1"));
});

async function fillContact(page: Page) {
  await page.getByLabel("Full name *").fill("E2E Upload Test");
  await page.getByLabel("Phone number *").fill("09123456789");
  await page.getByLabel("Email *").fill("e2e-upload@example.com");
}

/** Holds back the server action and reports how big its request body was. */
async function captureSubmit(page: Page) {
  const sizes: number[] = [];
  await page.route("**/quote**", async (route) => {
    const req = route.request();
    if (req.method() === "POST" && req.headers()["next-action"]) {
      sizes.push(req.postDataBuffer()?.length ?? 0);
      await route.abort("failed");
    } else {
      await route.continue();
    }
  });
  return sizes;
}

test("a large phone photo is shrunk before sending, and a failed send keeps the form", async ({ page }) => {
  await page.goto("/quote");
  await fillContact(page);

  // A noisy 4000×3000 photo, saved at high quality, is several MB: like a phone camera shot.
  const original = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 4000;
    canvas.height = 3000;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(4000, 3000);
    for (let i = 0; i < img.data.length; i++) img.data[i] = (i * 2654435761) % 256;
    ctx.putImageData(img, 0, 0);
    const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.98));
    const input = document.querySelector<HTMLInputElement>('input[name="attachment"]')!;
    const dt = new DataTransfer();
    dt.items.add(new File([blob], "IMG_2041.jpg", { type: "image/jpeg" }));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return blob.size;
  });
  expect(original).toBeGreaterThan(LIMIT);

  const sizes = await captureSubmit(page);
  await page.getByRole("button", { name: /Submit inquiry/ }).click();

  await expect.poll(() => sizes.length).toBe(1);
  expect(sizes[0]).toBeLessThan(LIMIT);
  // The request failed (we aborted it): a message, not a crashed page, and nothing lost.
  await expect(page.getByRole("alert").filter({ hasText: /couldn.t send your request/i })).toBeVisible();
  await expect(page.getByLabel("Full name *")).toHaveValue("E2E Upload Test");
});

test("a PDF over the limit is stopped with a plain message, before anything is sent", async ({ page }) => {
  await page.goto("/quote");
  await fillContact(page);
  const pdf = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(5 * 1024 * 1024, 32)]);
  await page.locator('input[name="attachment"]').setInputFiles({ name: "design.pdf", mimeType: "application/pdf", buffer: pdf });

  const sizes = await captureSubmit(page);
  await page.getByRole("button", { name: /Submit inquiry/ }).click();

  await expect(page.getByRole("alert").filter({ hasText: "over 4 MB" })).toBeVisible();
  await expect(page.locator("#q-file-err")).toContainText("over 4 MB");
  expect(sizes).toHaveLength(0);

  await page.getByRole("button", { name: "Remove this file" }).click();
  await expect(page.getByText("Attach your design")).toBeVisible();
});
