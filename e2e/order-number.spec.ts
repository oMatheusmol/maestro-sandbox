import { expect, test, type Page } from "@playwright/test";
import { ORDER_PLACED } from "./order-placed.js";

async function fillShipping(page: Page): Promise<void> {
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
}

test("shows the order number in the confirmation message", async ({ page }) => {
  await page.goto("/");
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();

  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
});
