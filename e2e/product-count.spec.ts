import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("shows the number of distinct products, not the item count, above the total", async ({ page }, testInfo) => {
  await page.goto("/");

  // Three products, four items: USB-C cable 2 m is in the cart twice.
  const count = page.locator("#product-count");
  await expect(count).toHaveText("Products in cart: 3");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
  const countBox = await count.boundingBox();
  const totalBox = await page.locator("#total").boundingBox();
  expect(countBox).not.toBeNull();
  expect(totalBox).not.toBeNull();
  if (countBox && totalBox) {
    expect(countBox.y + countBox.height).toBeLessThanOrEqual(totalBox.y);
  }
  expect(await photograph(page, testInfo, "checkout-product-count")).toMatch(/checkout-product-count\.png$/);
});
