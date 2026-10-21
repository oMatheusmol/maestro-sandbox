import { expect, test } from "@playwright/test";

test("shows the cart's item count right after the total", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#total + .item-count")).toHaveText("4 items");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
});

test("shows the cart's item count next to the checkout heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Checkout (4)", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Clear cart", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Checkout (0)", exact: true })).toBeVisible();
});
