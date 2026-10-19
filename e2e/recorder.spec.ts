import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

// Replaces MediaRecorder with a recorder that finishes without any audio data.
const EMPTY_RECORDER = `
  window.MediaRecorder = class {
    constructor(stream) {
      this.stream = stream;
      this.mimeType = "audio/webm";
      this.listeners = {};
    }
    addEventListener(type, listener) {
      (this.listeners[type] ||= []).push(listener);
    }
    start() {}
    stop() {
      setTimeout(() => {
        (this.listeners.dataavailable || []).forEach((listener) => listener({ data: new Blob([]) }));
        (this.listeners.stop || []).forEach((listener) => listener(new Event("stop")));
      }, 0);
    }
  };
`;

test("posts the recorded audio, not an empty body", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.goto("/recorder.html");

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled({ timeout: 15_000 });
  await page.waitForTimeout(500);

  const upload = page.waitForResponse("/api/notes");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  expect((await upload).status()).toBe(201);

  await expect(page.getByLabel("Sent notes").locator("li").first()).toContainText(/\d+\.\d+ s · [1-9]\d* KB/);
  await photograph(page, testInfo, "recorder");
});

test("sends nothing for an empty recording", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.addInitScript(EMPTY_RECORDER);
  let uploads = 0;
  await page.route("/api/notes", (route) => {
    uploads += 1;
    return route.fulfill({ status: 201 });
  });
  await page.goto("/recorder.html");

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Stop", exact: true }).click();

  await expect(page.getByRole("status")).toHaveText("Nothing was recorded. Try again.");
  await expect(page.getByRole("button", { name: "Record", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Sent notes").locator("li")).toHaveCount(0);
  expect(uploads).toBe(0);
  await photograph(page, testInfo, "recorder");
});
