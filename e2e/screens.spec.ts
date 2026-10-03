import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

/** The shop's screens, each photographed in every viewport. */
const SCREENS = [
  { name: "checkout", path: "/", heading: "Checkout" },
  { name: "recorder", path: "/recorder.html", heading: "Voice note" },
];

for (const screen of SCREENS) {
  test(`opens the ${screen.name} screen`, async ({ page }, testInfo) => {
    await page.goto(screen.path);
    await expect(page.getByRole("heading", { level: 1, name: screen.heading })).toBeVisible();
    await photograph(page, testInfo, screen.name);
  });
}
