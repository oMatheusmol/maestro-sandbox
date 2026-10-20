import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("shows the average price per item right after the item count", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#clear-cart + #average-price")).toHaveText(
    "Average price per item: R$ 282,18",
  );
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");

  await photograph(page, testInfo, "checkout");
});
