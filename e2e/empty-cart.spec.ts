import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("shows 'Your cart is empty' once Clear cart empties the cart", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Clear cart", exact: true }).click();

  await expect(page.locator("#lines li")).toHaveCount(0);
  await expect(page.getByText("Your cart is empty")).toBeVisible();

  await photograph(page, testInfo, "checkout-cart-empty");
});

test("hides 'Your cart is empty' while the cart has items", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#empty-cart")).toHaveCount(1);
  await expect(page.locator("#empty-cart")).toBeHidden();
});
