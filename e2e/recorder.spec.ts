import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

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
