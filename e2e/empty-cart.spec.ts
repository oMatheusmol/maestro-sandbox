import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("hides the empty cart message while the cart has items", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#lines li")).not.toHaveCount(0);
  await expect(page.locator("#empty-cart")).toBeHidden();

  await photograph(page, testInfo, "checkout");
});

test("shows Your cart is empty once Clear cart empties the cart", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Clear cart", exact: true }).click();

  await expect(page.locator("#lines li")).toHaveCount(0);
  await expect(page.locator("#empty-cart")).toBeVisible();
  await expect(page.locator("#empty-cart")).toHaveText("Your cart is empty");

  await photograph(page, testInfo, "checkout-cart-empty");
});
