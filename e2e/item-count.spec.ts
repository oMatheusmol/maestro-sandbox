import { expect, test } from "@playwright/test";

test("shows the cart's item count right after the total", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#total + .item-count")).toHaveText("4 items");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
});
