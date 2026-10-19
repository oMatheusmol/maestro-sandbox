import { expect, test, type Page } from "@playwright/test";
import { photograph } from "./screens.js";

/** The browser key the checkout keeps the placed order under. */
const ORDER_KEY = "sandbox-shop:placed-order";

async function fillShipping(page: Page): Promise<void> {
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
}

/** Places an order from a fresh checkout and returns its order number. */
async function placeOrder(page: Page): Promise<string> {
  await page.goto("/");
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toHaveText("Order placed. You will get an email with the tracking code.");
  const line = await page.locator("#order-number").textContent();
  return line!.replace("Order number: ", "");
}

test("shows the order number once placed and keeps it after a page reload", async ({ page }, testInfo) => {
  const number = await placeOrder(page);
  expect(number).toMatch(/^[0-9A-HJKMNP-TV-Z]{8}$/);
  await expect(page.locator("#order-number")).toHaveText(`Order number: ${number}`);

  await page.reload();

  await expect(page.getByRole("status")).toHaveText("Order placed. You will get an email with the tracking code.");
  await expect(page.locator("#order-number")).toHaveText(`Order number: ${number}`);
  await expect(page.locator("#pay")).toBeDisabled();
  await expect(page.getByLabel("Standard")).toBeDisabled();
  await photograph(page, testInfo, "checkout-order-number");
});

test("gives a second order a different number once the first is cleared", async ({ page }) => {
  const first = await placeOrder(page);

  await page.evaluate((key) => localStorage.removeItem(key), ORDER_KEY);
  const second = await placeOrder(page);

  expect(second).not.toBe(first);
});

test("starts a fresh checkout when the saved order is malformed", async ({ page }) => {
  await page.goto("/");

  for (const saved of ["{not json", JSON.stringify({ number: "lowercase", method: "standard", costCents: 0, totalCents: 0 })]) {
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: saved });
    await page.reload();

    await expect(page.locator("#placed")).toBeEmpty();
    await expect(page.locator("#order-number")).toBeHidden();
    await expect(page.locator("#pay")).toBeEnabled();
  }
});

test("starts a fresh checkout when the saved order has no valid points balance", async ({ page }) => {
  await page.goto("/");
  const order = { number: "ABCDEFGH", method: "standard", costCents: 0, totalCents: 0 };

  for (const balanceAfter of [undefined, -1, 1.5]) {
    const saved = JSON.stringify({ ...order, balanceAfter });
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: saved });
    await page.reload();

    await expect(page.locator("#placed")).toBeEmpty();
    await expect(page.locator("#order-number")).toBeHidden();
    await expect(page.locator("#points-balance")).toHaveText("Points balance: 1000");
    await expect(page.locator("#pay")).toBeEnabled();
  }
});
