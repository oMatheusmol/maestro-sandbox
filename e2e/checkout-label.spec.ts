import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("shows the total under the label Total do pedido", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");

  await page.getByLabel("Coupon code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.015,83");
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.015,83 with Standard shipping");
});

test("names the chosen shipping method on the pay button", async ({ page }, testInfo) => {
  await page.goto("/");
  const pay = page.locator("#pay");
  const option = (name: string) => page.locator(".delivery .option", { hasText: name });

  await option("Express").click();
  await expect(pay).toHaveText("Place order and pay R$ 1.155,70 with Express shipping");

  await option("Scheduled").click();
  await expect(pay).toHaveText("Place order and pay R$ 1.133,70 with Scheduled shipping");

  await option("Standard").click();
  await expect(pay).toHaveText("Place order and pay R$ 1.128,70 with Standard shipping");
  expect(await photograph(page, testInfo, "checkout-pay-method")).toMatch(/checkout-pay-method\.png$/);
});
