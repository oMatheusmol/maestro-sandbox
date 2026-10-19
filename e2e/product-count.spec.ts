import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("shows the number of distinct products in the cart summary", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#product-count")).toHaveText("Products in cart: 3");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");

  await photograph(page, testInfo, "checkout");
});
