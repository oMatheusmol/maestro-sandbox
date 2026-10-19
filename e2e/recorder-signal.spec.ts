import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("records a voice note and uploads the captured audio", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.goto("/recorder.html");

  const recordButton = page.getByRole("button", { name: "Record", exact: true });
  const stopButton = page.getByRole("button", { name: "Stop", exact: true });
  const notesList = page.getByLabel("Sent notes");

  await recordButton.click();
  await expect(stopButton).toBeEnabled({ timeout: 15_000 });
  await expect(page.getByRole("status")).toHaveText("Recording…");
  // Stop runs only once the recorder reports captured audio.
  await expect(page.locator("#recorder")).toHaveAttribute("data-captured-bytes", /^[1-9]\d*$/, { timeout: 15_000 });

  const upload = page.waitForResponse("/api/notes");
  await stopButton.click();
  expect((await upload).status()).toBe(201);

  await expect(notesList.locator("li").first()).toContainText(/\d+\.\d+ s · [1-9]\d* KB/);
  await photograph(page, testInfo, "recorder-signal");
});

test("records a voice note when the microphone is slow to start", async ({ page, context }) => {
  await context.grantPermissions(["microphone"]);
  // Delays the microphone grant past Playwright's default 5-second expect timeout.
  await page.addInitScript(() => {
    const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = (constraints?: MediaStreamConstraints) =>
      new Promise((resolve) => setTimeout(() => resolve(getUserMedia(constraints)), 6000));
  });
  await page.goto("/recorder.html");

  const recordButton = page.getByRole("button", { name: "Record" });
  const stopButton = page.getByRole("button", { name: "Stop" });
  const notesList = page.getByLabel("Sent notes");

  await recordButton.click();
  await expect(page.getByRole("status")).toHaveText("Recording…", { timeout: 15000 });
  // Stop runs only once the recorder reports captured audio.
  await expect(page.locator("#recorder")).toHaveAttribute("data-captured-bytes", /^[1-9]\d*$/, { timeout: 15_000 });
  await stopButton.click();

  const noteItem = notesList.locator("li").first();
  await expect(noteItem).toContainText(/\d+\.\d+ s · [1-9]\d* KB/);
});
