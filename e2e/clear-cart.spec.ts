import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("shows a Clear cart link right after the item count", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".item-count + #clear-cart")).toHaveText("Clear cart");
  await expect(page.locator("#total + .item-count")).toHaveText("4 items");

  await photograph(page, testInfo, "checkout");
});

test("clicking Clear cart empties the cart and disables Place order", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Clear cart", exact: true }).click();

  await expect(page.locator("#lines li")).toHaveCount(0);
  await expect(page.locator("#product-count")).toHaveText("Products in cart: 0");
  await expect(page.locator(".item-count")).toHaveText("0 items");
  await expect(page.locator("#pay")).toBeDisabled();

  await photograph(page, testInfo, "checkout-cart-cleared");
});

test("the Clear cart link is hidden once an order is placed", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
  await page.getByRole("button", { name: /Place order and pay/ }).click();

  await expect(page.getByRole("status")).toContainText("Order placed");
  await expect(page.locator("#clear-cart")).toBeHidden();
});
