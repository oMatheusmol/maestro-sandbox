import { expect, test, type Page } from "@playwright/test";
import { ORDER_PLACED } from "./order-placed.js";
import { photograph } from "./screens.js";

/** The browser key the checkout keeps the placed order under. */
const ORDER_KEY = "sandbox-shop:placed-order";

/** A frozen browser clock, so the order date is the same in every run. */
const NOW = new Date("2026-10-10T12:00:00Z");

async function fillShipping(page: Page): Promise<void> {
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
}

/** Places an order from a fresh checkout and waits for the confirmation. */
async function placeOrder(page: Page): Promise<void> {
  await page.goto("/");
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

test("shows the order date in the confirmation message", async ({ page }, testInfo) => {
  await placeOrder(page);

  await expect(page.locator("#order-date")).toHaveText("Order date: 2026-10-10.");
  await photograph(page, testInfo, "checkout-order-date");
});

test("keeps the order date in the confirmation after a page reload", async ({ page }, testInfo) => {
  await placeOrder(page);

  await page.reload();

  await expect(page.locator("#order-date")).toHaveText("Order date: 2026-10-10.");
  await photograph(page, testInfo, "checkout-order-date-reload");
});

test("hides the order date for a saved order that has no placedOn", async ({ page }) => {
  await page.goto("/");
  const saved = { number: "ABCDEFGH", method: "standard", costCents: 0, totalCents: 10000, balanceAfter: 1000 };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });
  await page.reload();

  await expect(page.getByRole("status")).toHaveText("Order placed: ABCDEFGH. You will get an email with the tracking code.");
  await expect(page.locator("#order-date")).toBeHidden();
});

test("starts a fresh checkout when the saved order has a non-string placedOn", async ({ page }) => {
  await page.goto("/");
  const saved = { number: "ABCDEFGH", method: "standard", costCents: 0, totalCents: 10000, balanceAfter: 1000, placedOn: 20261010 };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });
  await page.reload();

  await expect(page.locator("#placed")).toBeEmpty();
  await expect(page.locator("#order-date")).toBeHidden();
  await expect(page.locator("#pay")).toBeEnabled();
});
