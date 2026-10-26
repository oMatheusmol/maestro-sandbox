import { expect, test, type Page } from "@playwright/test";
import { ORDER_PLACED } from "./order-placed.js";
import { photograph } from "./screens.js";

/** The browser key the checkout keeps the placed order under. */
const ORDER_KEY = "sandbox-shop:placed-order";

async function fillShipping(page: Page): Promise<void> {
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
}

/** Places an order from a fresh checkout. */
async function placeOrder(page: Page): Promise<void> {
  await page.goto("/");
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
}

/** The UTC calendar date the checkout stamps on an order placed now. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

test("shows the order date in the confirmation after an order is placed", async ({ page }, testInfo) => {
  await placeOrder(page);

  await expect(page.locator("#placed-on")).toHaveText(`Order date: ${today()}.`);
  await photograph(page, testInfo, "checkout-order-date");
});

test("keeps the order date in the confirmation after a page reload", async ({ page }) => {
  await placeOrder(page);
  const date = `Order date: ${today()}.`;

  await page.reload();

  await expect(page.locator("#placed-on")).toHaveText(date);
});

test("hides the order date for a saved order that has none", async ({ page }, testInfo) => {
  await page.goto("/");
  const saved = { number: "ABCDEFGH", method: "standard", costCents: 0, totalCents: 10000, balanceAfter: 1000 };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });
  await page.reload();

  await expect(page.getByRole("status")).toHaveText("Order placed: ABCDEFGH. You will get an email with the tracking code.");
  await expect(page.locator("#placed-on")).toBeHidden();
  await photograph(page, testInfo, "checkout-restored-without-order-date");
});
