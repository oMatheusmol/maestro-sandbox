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
    start() {
      setTimeout(() => (this.listeners.start || []).forEach((listener) => listener(new Event("start"))), 0);
    }
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
    start() {
      setTimeout(() => (this.listeners.start || []).forEach((listener) => listener(new Event("start"))), 0);
    }
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

// Replaces MediaRecorder with a recorder whose start() throws, and keeps the stream it was given.
const THROWING_RECORDER = `
  window.MediaRecorder = class {
    constructor(stream) {
      this.stream = stream;
      this.mimeType = "audio/webm";
      window.capturedStream = stream;
    }
    addEventListener() {}
    start() {
      throw new DOMException("Recorder failed to start", "InvalidStateError");
    }
  };
`;

// Replaces MediaRecorder with a recorder whose start() never dispatches the start event.
const SILENT_START_RECORDER = `
  window.MediaRecorder = class {
    constructor(stream) {
      this.stream = stream;
      this.mimeType = "audio/webm";
    }
    addEventListener() {}
    start() {}
    stop() {}
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
  expect(await photograph(page, testInfo, "recorder-posted")).toMatch(/recorder-posted\.png$/);
});

test("uploads the audio captured before the microphone is released", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.addInitScript(LIVE_RECORDER);
  await page.goto("/recorder.html");

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled({ timeout: 15_000 });
  const upload = page.waitForResponse("/api/notes");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  expect((await upload).status()).toBe(201);

  await expect(page.getByLabel("Sent notes").locator("li").first()).toContainText(/\d+\.\d+ s · [1-9]\d* KB/);
  expect(await photograph(page, testInfo, "recorder-released")).toMatch(/recorder-released\.png$/);
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
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled({ timeout: 15_000 });
  await page.getByRole("button", { name: "Stop", exact: true }).click();

  await expect(page.getByRole("status")).toHaveText("Nothing was recorded. Try again.");
  await expect(page.getByRole("button", { name: "Record", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Sent notes").locator("li")).toHaveCount(0);
  expect(uploads).toBe(0);
  expect(await photograph(page, testInfo, "recorder-empty")).toMatch(/recorder-empty\.png$/);
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
  expect(await photograph(page, testInfo, "recorder-pending")).toMatch(/recorder-pending\.png$/);

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
  expect(await photograph(page, testInfo, "recorder-refused")).toMatch(/recorder-refused\.png$/);
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
  expect(await photograph(page, testInfo, "recorder-captured")).toMatch(/recorder-captured\.png$/);
});

test("reports no captured audio when the microphone is refused", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.addInitScript(holdMicrophoneRequest);
  await page.goto("/recorder.html");
  await expect(page.locator("#recorder")).toHaveAttribute("data-captured-bytes", "0");

  const recordButton = page.getByRole("button", { name: "Record", exact: true });
  const status = page.getByRole("status");

  await recordButton.click();
  await expect(status).toHaveText("Waiting for microphone permission…");
  await page.evaluate(() => (window as unknown as { settleMicrophone: (grant: boolean) => void }).settleMicrophone(true));
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled({ timeout: 15_000 });
  await expect(page.locator("#recorder")).toHaveAttribute("data-captured-bytes", /^[1-9]\d*$/, { timeout: 15_000 });

  const upload = page.waitForResponse("/api/notes");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  expect((await upload).status()).toBe(201);
  await expect(recordButton).toBeEnabled();

  await recordButton.click();
  await expect(status).toHaveText("Waiting for microphone permission…");
  await expect(page.locator("#recorder")).toHaveAttribute("data-captured-bytes", "0");

  await page.evaluate(() => (window as unknown as { settleMicrophone: (grant: boolean) => void }).settleMicrophone(false));
  await expect(status).toHaveText("The microphone is not available. Allow it in the browser and try again.");
  await expect(page.locator("#recorder")).toHaveAttribute("data-captured-bytes", "0");
  expect(await photograph(page, testInfo, "recorder-no-audio")).toMatch(/recorder-no-audio\.png$/);
});

test("reports a recorder whose start event never fires and re-enables Record", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.addInitScript(SILENT_START_RECORDER);
  await page.goto("/recorder.html");

  const recordButton = page.getByRole("button", { name: "Record", exact: true });
  const stopButton = page.getByRole("button", { name: "Stop", exact: true });

  await recordButton.click();
  await expect(page.getByRole("status")).toHaveText("Recording did not start. Try again.", { timeout: 15_000 });
  await expect(recordButton).toBeEnabled();
  await expect(stopButton).toBeDisabled();
  expect(await photograph(page, testInfo, "recorder-start-missing")).toMatch(/recorder-start-missing\.png$/);
});

test("re-enables Record and shows an error status when the recorder fails to start", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.addInitScript(THROWING_RECORDER);
  await page.goto("/recorder.html");

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Recording could not start. Try again.");
  await expect(page.getByRole("button", { name: "Record", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeDisabled();

  const trackStates = await page.evaluate(() =>
    (window as unknown as { capturedStream: MediaStream }).capturedStream.getTracks().map((track) => track.readyState),
  );
  expect(trackStates.length).toBeGreaterThan(0);
  expect(trackStates.every((state) => state === "ended")).toBe(true);
  await photograph(page, testInfo, "recorder");
});
