import { expect, test } from "@playwright/test";

/** Ready-made designs in the 3D Studio: pick one, type your words, it lands on the shirt as layers. */

type Draft = {
  shirtColor: string;
  assets: {
    kind: string;
    placement: string;
    fileName: string;
    url: string;
    position: number[];
    rotation: number[];
    template?: { id: string; piece: string; values: Record<string, string> };
  }[];
};

/** A 1×1 red PNG, standing in for a customer's own logo. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
  "base64",
);

const readDraft =(page: import("@playwright/test").Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("print_shop_draft") ?? "null") as unknown);

test("a template with the customer's own words goes onto the shirt", async ({ page }) => {
  test.setTimeout(120_000); // the 3D page renders in software in headless Chrome
  await page.addInitScript(() => localStorage.setItem("studio_guide_seen", "1"));
  await page.goto("/customizer");
  await page.getByRole("button", { name: /Next: add your design/ }).click();

  const designs = page.getByRole("list", { name: "Ready-made designs" });
  await expect(designs.getByRole("listitem")).toHaveCount(6);
  await designs.getByRole("button", { name: /Team jersey/ }).click();

  const dialog = page.getByRole("dialog", { name: "Team jersey" });
  await expect(dialog.getByLabel("Team name")).toHaveValue("Eagles");
  await dialog.getByLabel("Team name").fill("Silay Sharks");
  await dialog.getByLabel(/Player surname/).fill("Villanueva");
  await dialog.getByLabel("Jersey number").fill("7");
  await dialog.getByRole("button", { name: /Put it on my shirt/ }).click();
  await expect(dialog).toBeHidden();

  await expect.poll(async () => ((await readDraft(page)) as Draft | null)?.assets.length).toBe(2);
  const draft = (await readDraft(page)) as Draft;
  expect(draft.shirtColor).toBe("#1B2A4A");
  const [front, back] = draft.assets;
  expect(front).toMatchObject({ kind: "image", placement: "front", fileName: "Team jersey · Front" });
  expect(back).toMatchObject({ kind: "image", placement: "back", fileName: "Team jersey · Back" });
  expect(back.position[2]).toBeLessThan(0);
  expect(back.rotation[1]).toBeCloseTo(Math.PI);
  expect(front.url).toMatch(/^data:image\/png;base64,/);

  // The words stay editable: move the front print, then change the number from the selected layer.
  await page.getByRole("option", { name: /Team jersey · Front/ }).click();
  await page.getByRole("button", { name: "Move up" }).click();
  await expect
    .poll(async () => ((await readDraft(page)) as Draft).assets[0].position[1])
    .toBeGreaterThan(front.position[1]);
  const moved = ((await readDraft(page)) as Draft).assets[0];

  await page.getByRole("button", { name: "Edit the words" }).first().click();
  const edit = page.getByRole("dialog", { name: "Team jersey" });
  await expect(edit.getByLabel("Team name")).toHaveValue("Silay Sharks");
  await expect(edit.getByLabel("Jersey number")).toHaveValue("7");
  await expect(edit).not.toContainText("This replaces");
  await edit.getByLabel("Jersey number").fill("23");
  await edit.getByRole("button", { name: /Save the words/ }).click();
  await expect(edit).toBeHidden();

  await expect.poll(async () => ((await readDraft(page)) as Draft).assets[1].template?.values.number).toBe("23");
  const edited = (await readDraft(page)) as Draft;
  expect(edited.assets).toHaveLength(2);
  expect(edited.shirtColor).toBe("#1B2A4A");
  expect(edited.assets[0].position).toEqual(moved.position); // stayed where it was moved
  expect(edited.assets[0].template?.values.team).toBe("Silay Sharks");
  expect(edited.assets[1].url).not.toBe(back.url); // back artwork redrawn with the new number

  // Templates are optional: the design can be taken off again (keeping the customer's own
  // upload and the shirt color), and the removal undone.
  await page.locator('input[type="file"][accept="image/*"]').setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
  await expect.poll(async () => ((await readDraft(page)) as Draft).assets).toHaveLength(3);
  await page.getByRole("button", { name: "Remove this design" }).first().click();
  await expect.poll(async () => ((await readDraft(page)) as Draft).assets.map((a) => a.fileName)).toEqual(["logo.png"]);
  expect(((await readDraft(page)) as Draft).shirtColor).toBe("#1B2A4A");
  await expect(page.getByRole("button", { name: "Edit the words" })).toHaveCount(0);
  const undo = page.getByRole("button", { name: "Undo" });
  await expect(undo).toBeInViewport({ ratio: 1 });
  await undo.click();
  await expect.poll(async () => ((await readDraft(page)) as Draft).assets).toHaveLength(3);
  await expect(page.getByRole("button", { name: "Edit the words" })).toBeVisible();

  // Picking another template warns before replacing, then swaps the whole design.
  await designs.getByRole("button", { name: /Family reunion/ }).click();
  const family = page.getByRole("dialog", { name: "Family reunion" });
  await expect(family).toContainText("This replaces the design that is on your shirt now.");
  await family.getByRole("button", { name: /Put it on my shirt/ }).click();
  await expect.poll(async () => ((await readDraft(page)) as Draft).assets[0]?.fileName).toBe("Family reunion · Front");
  expect(((await readDraft(page)) as Draft).shirtColor).toBe("#FFFFFF");
});

test("Send to quote arrives with the mockup already attached", async ({ page }) => {
  test.setTimeout(120_000); // renders four views of the 3D shirt in software
  await page.addInitScript(() => localStorage.setItem("studio_guide_seen", "1"));
  await page.goto("/customizer");
  await page.getByRole("button", { name: /Use a ready-made one/ }).click();
  await page.getByRole("list", { name: "Ready-made designs" }).getByRole("button", { name: /Team jersey/ }).click();
  await page.getByRole("button", { name: /Put it on my shirt/ }).click();
  await page.getByRole("button", { name: /Review/ }).click();
  await page.getByRole("button", { name: /Send to quote/ }).click();

  await expect(page).toHaveURL(/\/quote\?product=T-Shirt&from=studio/, { timeout: 60_000 });
  await expect(page.getByText("Your 3D Studio mockup is attached")).toBeVisible();
  const attached = await page
    .locator('input[name="attachment"]')
    .evaluate((input: HTMLInputElement) => ({ name: input.files?.[0]?.name, type: input.files?.[0]?.type, size: input.files?.[0]?.size }));
  expect(attached).toMatchObject({ name: "3d-studio-mockup.png", type: "image/png" });
  expect(attached.size).toBeGreaterThan(10_000);

  // It can be taken off like any other file.
  await page.getByRole("button", { name: "Remove this file" }).click();
  await expect(page.getByText("Attach your design")).toBeVisible();
});

test("cancel leaves the shirt as it was", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("studio_guide_seen", "1"));
  await page.goto("/customizer");
  await page.getByRole("button", { name: /Use a ready-made one/ }).click();
  await page.getByRole("list", { name: "Ready-made designs" }).getByRole("button", { name: /Club officer/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  const draft = (await readDraft(page)) as Draft | null;
  expect(draft?.assets ?? []).toHaveLength(0);
});
