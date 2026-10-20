import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("shows the unit price under the total of a line with more than one unit", async ({ page }, testInfo) => {
  await page.goto("/");
  const line = page.locator(".lines li", { hasText: "USB-C cable, 2 m × 2" });
  await expect(line.locator(".price")).toHaveText("R$ 99,80");
  await expect(line.locator(".unit-price")).toHaveText("R$ 49,90 each");

  expect(await photograph(page, testInfo, "checkout-unit-price")).toMatch(/checkout-unit-price\.png$/);
});

test("shows no unit price on a line with a single unit", async ({ page }) => {
  await page.goto("/");
  const line = page.locator(".lines li", { hasText: "Mechanical keyboard" });
  await expect(line.locator(".price")).toHaveText("R$ 899,90");
  await expect(line.locator(".unit-price")).toHaveCount(0);
});
