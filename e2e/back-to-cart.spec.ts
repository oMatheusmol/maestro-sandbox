import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("shows a Back to cart link directly above the place order button", async ({ page }, testInfo) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: "Back to cart", exact: true });
  await expect(link).toBeVisible();
  await expect(page.locator("#back-to-cart + .actions")).toBeVisible();

  await photograph(page, testInfo, "checkout-back-to-cart");
});

test("Back to cart returns to the cart summary with the items kept", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.locator("#pay").scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "Back to cart", exact: true }).click();

  await expect(page).toHaveURL(/\/#cart-title$/);
  await expect(page.locator("#cart-title")).toBeInViewport();
  await expect(page.locator("#lines li")).toHaveCount(3);
  await expect(page.locator("#product-count")).toHaveText("Products in cart: 3");
  await expect(page.locator(".item-count")).toHaveText("4 items");

  await photograph(page, testInfo, "checkout-back-to-cart-returned");
});
