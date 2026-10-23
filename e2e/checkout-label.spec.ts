import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("shows the total under the label Total do pedido", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");

  await page.getByLabel("Coupon code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.015,83");
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.015,83 (Standard)");
});

test("names the chosen shipping method on the pay button", async ({ page, viewport }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.128,70 (Standard)");

  await page.locator(".delivery .option", { hasText: "Express" }).click();
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.155,70 (Express)");

  await page.locator(".delivery .option", { hasText: "Scheduled" }).click();
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.133,70 (Scheduled)");

  // The longer label stays inside the viewport width on phone and desktop.
  const payBox = await page.locator("#pay").boundingBox();
  expect(payBox).not.toBeNull();
  if (payBox && viewport) {
    expect(payBox.x).toBeGreaterThanOrEqual(0);
    expect(payBox.x + payBox.width).toBeLessThanOrEqual(viewport.width);
  }
  expect(await photograph(page, testInfo, "checkout-pay-label")).toMatch(/checkout-pay-label\.png$/);
});
