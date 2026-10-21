import { expect, test, type Page } from "@playwright/test";
import { ORDER_PLACED } from "./order-placed.js";
import { photograph } from "./screens.js";

/** A frozen browser clock, so the order date is the same in every run. */
const NOW = new Date("2026-10-10T12:00:00Z");

async function fillShipping(page: Page): Promise<void> {
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
}

test("shows the order date under the confirmation after an order is placed", async ({ page }, testInfo) => {
  await page.clock.setFixedTime(NOW);
  await page.goto("/");
  await expect(page.locator("#placed-date")).toBeHidden();
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();

  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
  await expect(page.locator("#placed-date")).toHaveText("Order date: 2026-10-10");
  await photograph(page, testInfo, "checkout-order-date");
});
