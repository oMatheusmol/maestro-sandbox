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

/** Places an order from a fresh checkout and returns the date the saved order keeps. */
async function placeOrder(page: Page): Promise<string> {
  await page.goto("/");
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
  const saved = await page.evaluate((key) => localStorage.getItem(key), ORDER_KEY);
  return JSON.parse(saved!).placedOn;
}

test("shows the order date in the confirmation", async ({ page }, testInfo) => {
  const placedOn = await placeOrder(page);

  await expect(page.locator("#order-date")).toHaveText(`Order date: ${placedOn}.`);
  await photograph(page, testInfo, "checkout-order-date");
});

test("keeps the order date after a page reload", async ({ page }) => {
  const placedOn = await placeOrder(page);

  await page.reload();

  await expect(page.locator("#order-date")).toHaveText(`Order date: ${placedOn}.`);
});

test("hides the order date for a saved order without one", async ({ page }) => {
  await page.goto("/");
  const saved = { number: "ABCDEFGH", method: "standard", costCents: 0, totalCents: 10000, balanceAfter: 1000 };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });
  await page.reload();

  await expect(page.getByRole("status")).toHaveText("Order placed: ABCDEFGH. You will get an email with the tracking code.");
  await expect(page.locator("#order-date")).toBeHidden();
});

test("starts a fresh checkout when the saved order has a malformed order date", async ({ page }) => {
  await page.goto("/");
  const saved = { number: "ABCDEFGH", method: "standard", costCents: 0, totalCents: 10000, balanceAfter: 1000, placedOn: "2026-02-30" };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });
  await page.reload();

  await expect(page.locator("#placed")).toBeEmpty();
  await expect(page.locator("#pay")).toBeEnabled();
});
