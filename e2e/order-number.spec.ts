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

/** Places an order from a fresh checkout and returns its order number, read from the confirmation. */
async function placeOrder(page: Page): Promise<string> {
  await page.goto("/");
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
  return (await page.getByRole("status").textContent())!.match(/Order placed: (\w{8})\./)![1]!;
}

test("shows the order number in the confirmation message", async ({ page }, testInfo) => {
  const number = await placeOrder(page);
  expect(number).toMatch(/^[0-9A-HJKMNP-TV-Z]{8}$/);
  await photograph(page, testInfo, "checkout-order-number");
});

test("keeps the order number in the confirmation after a page reload", async ({ page }) => {
  const number = await placeOrder(page);

  await page.reload();

  await expect(page.getByRole("status")).toHaveText(`Order placed: ${number}. You will get an email with the tracking code.`);
  await expect(page.locator("#pay")).toBeDisabled();
  await expect(page.getByLabel("Standard")).toBeDisabled();
});

test("shows the captured total on the pay button after a restored order", async ({ page }, testInfo) => {
  await page.goto("/");
  const saved = { number: "ABCDEFGH", method: "standard", costCents: 0, totalCents: 10000, balanceAfter: 1000 };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });
  await page.reload();

  await expect(page.locator("#pay")).toBeDisabled();
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 100,00");
  await expect(page.locator("#delivery-details")).toContainText("Total: R$ 100,00.");
  await photograph(page, testInfo, "checkout-restored-total");
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
    await expect(page.locator("#pay")).toBeEnabled();
  }
});

test("starts a fresh checkout when the saved order has no valid points balance", async ({ page }) => {
  await page.goto("/");
  const order = { number: "ABCDEFGH", method: "standard", costCents: 0, totalCents: 0 };

  for (const balanceAfter of [-1, 1.5, "1000"]) {
    const saved = JSON.stringify({ ...order, balanceAfter });
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: saved });
    await page.reload();

    await expect(page.locator("#placed")).toBeEmpty();
    await expect(page.locator("#points-balance")).toHaveText("Points balance: 1000");
    await expect(page.locator("#pay")).toBeEnabled();
  }
});

test("restores an order saved without a points balance: number, placed state and balance after a reload", async ({ page }, testInfo) => {
  await page.goto("/");
  const saved = { number: "ABCDEFGH", method: "standard", costCents: 1000, totalCents: 10000 };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });
  await page.reload();

  await expect(page.getByRole("status")).toHaveText("Order placed: ABCDEFGH. You will get an email with the tracking code.");
  await expect(page.locator("#pay")).toBeDisabled();
  await expect(page.locator("#points-balance")).toHaveText("Points balance: 1000");
  await photograph(page, testInfo, "checkout-restored-order");
});

test("shows the points earned line after a reload of a saved order", async ({ page }) => {
  await page.goto("/");
  const saved = { number: "ABCDEFGH", method: "standard", costCents: 0, totalCents: 10000, balanceAfter: 1100 };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });
  await page.reload();

  await expect(page.locator("#points-earned")).toHaveText("Points earned on this order: 100");
});

test("starts a fresh checkout when the saved order has a negative total", async ({ page }) => {
  await page.goto("/");
  const saved = { number: "ABCDEFGH", method: "standard", costCents: 0, totalCents: -1, balanceAfter: 0 };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });
  await page.reload();

  await expect(page.locator("#placed")).toBeEmpty();
  await expect(page.locator("#pay")).toBeEnabled();
});
