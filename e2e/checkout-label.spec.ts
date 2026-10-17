import { expect, test } from "@playwright/test";

test("shows the total under the label Total do pedido", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");

  await page.getByLabel("Coupon code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.015,83");
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.015,83");
});
