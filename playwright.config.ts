import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

const PORT = 4174;

/** What the fake microphone plays. */
const TONE = fileURLToPath(new URL("e2e/fixtures/tone.wav", import.meta.url));

// Every UI test runs once per viewport: a phone and a desktop.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    browserName: "chromium",
    // Keep a trace and a screenshot of the page only for tests that fail.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      // A fake microphone and camera, the microphone playing the tone, and no permission prompt.
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${TONE}`],
    },
  },
  projects: [
    { name: "phone", use: { viewport: { width: 375, height: 812 } } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
