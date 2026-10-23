import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

const HOURS = "Open Monday to Saturday, 9:00 to 18:00";

test("shows the opening hours in the footer of the checkout page", async ({ page }, testInfo) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await expect(footer).toBeVisible();
  await expect(footer).toHaveText(HOURS);

  await photograph(page, testInfo, "checkout-footer");
});

test("shows the opening hours in the footer of the voice note page", async ({ page }, testInfo) => {
  await page.goto("/recorder.html");

  const footer = page.getByRole("contentinfo");
  await expect(footer).toBeVisible();
  await expect(footer).toHaveText(HOURS);

  await photograph(page, testInfo, "recorder-footer");
});
