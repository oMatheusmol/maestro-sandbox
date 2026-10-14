import { expect, test } from "@playwright/test";

test("shows the checkout total labelled Total do pedido at phone and desktop widths", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
});
