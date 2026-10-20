import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("shows a Clear cart button right under the cart total", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#total + .item-count + #clear-cart")).toHaveText("Clear cart");

  expect(await photograph(page, testInfo, "checkout-clear-cart")).toMatch(/checkout-clear-cart\.png$/);
});

test("clicking Clear cart empties the cart and drops an applied coupon", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Coupon code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator("#discount")).toBeVisible();

  await page.locator("#clear-cart").click();

  await expect(page.locator("#lines li")).toHaveCount(0);
  await expect(page.locator("#product-count")).toHaveText("Products in cart: 0");
  await expect(page.locator(".item-count")).toHaveText("0 items");
  await expect(page.locator("#discount")).toBeHidden();
  await expect(page.locator("#coupon-expiry")).toBeHidden();
});
