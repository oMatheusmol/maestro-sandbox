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

// Replaces MediaRecorder with a recorder whose audio exists only while the microphone tracks are live.
const LIVE_RECORDER = `
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
        const live = this.stream.getTracks().some((track) => track.readyState === "live");
        const data = new Blob([live ? "audio" : ""], { type: this.mimeType });
        (this.listeners.dataavailable || []).forEach((listener) => listener({ data }));
        (this.listeners.stop || []).forEach((listener) => listener(new Event("stop")));
      }, 0);
    }
  };
`;

/**
 * Holds the microphone request open until the test settles it, so the pending
 * state can be seen. Granting runs the real getUserMedia; refusing rejects like a denied prompt.
 */
const holdMicrophoneRequest = () => {
  const realGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = () =>
    new Promise((resolve, reject) => {
      (window as unknown as Record<string, unknown>).settleMicrophone = (grant: boolean) => {
        if (grant) {
          realGetUserMedia({ audio: true }).then(resolve, reject);
        } else {
          reject(new DOMException("Permission denied", "NotAllowedError"));
        }
      };
    });
};

test("posts the recorded audio, not an empty body", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.goto("/recorder.html");

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled({ timeout: 15_000 });
  await expect(page.locator("#recorder")).toHaveAttribute("data-captured-bytes", /^[1-9]\d*$/, { timeout: 15_000 });

  const upload = page.waitForResponse("/api/notes");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  expect((await upload).status()).toBe(201);

  await expect(page.getByLabel("Sent notes").locator("li").first()).toContainText(/\d+\.\d+ s · [1-9]\d* KB/);
  await photograph(page, testInfo, "recorder");
});

test("uploads the audio captured before the microphone is released", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.addInitScript(LIVE_RECORDER);
  await page.goto("/recorder.html");

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled();
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

test("shows a pending microphone status and keeps Record disabled until the request resolves", async ({ page }, testInfo) => {
  await page.addInitScript(holdMicrophoneRequest);
  await page.goto("/recorder.html");

  const recordButton = page.getByRole("button", { name: "Record", exact: true });
  const stopButton = page.getByRole("button", { name: "Stop", exact: true });
  const status = page.getByRole("status");

  await recordButton.click();
  await expect(status).toHaveText("Waiting for microphone permission…");
  await expect(recordButton).toBeDisabled();
  await photograph(page, testInfo, "recorder");

  await page.evaluate(() => (window as unknown as { settleMicrophone: (grant: boolean) => void }).settleMicrophone(true));
  await expect(status).toHaveText("Recording…");
  await expect(stopButton).toBeEnabled();
});

test("shows an error status and re-enables Record when the microphone is refused", async ({ page }, testInfo) => {
  await page.addInitScript(holdMicrophoneRequest);
  await page.goto("/recorder.html");

  const recordButton = page.getByRole("button", { name: "Record", exact: true });
  const status = page.getByRole("status");

  await recordButton.click();
  await expect(status).toHaveText("Waiting for microphone permission…");

  await page.evaluate(() => (window as unknown as { settleMicrophone: (grant: boolean) => void }).settleMicrophone(false));
  await expect(status).toHaveText("The microphone is not available. Allow it in the browser and try again.");
  await expect(recordButton).toBeEnabled();
  await photograph(page, testInfo, "recorder");
});

test("reports captured audio on the recorder before Stop is clicked", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.goto("/recorder.html");

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled({ timeout: 15_000 });
  await expect(page.getByRole("status")).toHaveText("Recording…");
  await expect(page.locator("#recorder")).toHaveAttribute("data-captured-bytes", /^[1-9]\d*$/, { timeout: 15_000 });

  const upload = page.waitForResponse("/api/notes");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  expect((await upload).status()).toBe(201);
  await photograph(page, testInfo, "recorder");
});

test("reports no captured audio when the microphone is refused", async ({ page }, testInfo) => {
  await page.addInitScript(holdMicrophoneRequest);
  await page.goto("/recorder.html");

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Waiting for microphone permission…");

  await page.evaluate(() => (window as unknown as { settleMicrophone: (grant: boolean) => void }).settleMicrophone(false));
  await expect(page.getByRole("status")).toHaveText("The microphone is not available. Allow it in the browser and try again.");
  await expect(page.locator("#recorder")).toHaveAttribute("data-captured-bytes", "0");
  await photograph(page, testInfo, "recorder");
});
