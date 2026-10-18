import { expect, test } from "@playwright/test";

test("shows the item count in the total label", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#total")).toHaveText("Total (4 items): R$ 1.128,70");

  await page.getByLabel("Coupon code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.locator("#total")).toHaveText("Total (4 items): R$ 1.015,83");
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.015,83");
});
