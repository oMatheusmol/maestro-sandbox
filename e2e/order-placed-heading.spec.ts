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

test("shows 'Order placed!' as a heading above the confirmation message after placing an order", async ({ page }, testInfo) => {
  await page.goto("/");
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();

  const heading = page.getByRole("heading", { level: 2, name: "Order placed!", exact: true });
  await expect(heading).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
  expect((await heading.boundingBox())!.y).toBeLessThan((await page.getByRole("status").boundingBox())!.y);
  await photograph(page, testInfo, "checkout-order-placed-heading");
});

test("hides the 'Order placed!' heading on a fresh checkout before any order is placed", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Order placed!", exact: true })).toBeHidden();
});

test("keeps the 'Order placed!' heading above the confirmation after a reload of a saved order", async ({ page }, testInfo) => {
  await page.goto("/");
  const saved = { number: "ABCDEFGH", method: "standard", costCents: 0, totalCents: 10000, balanceAfter: 1000 };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });
  await page.reload();

  const heading = page.getByRole("heading", { level: 2, name: "Order placed!", exact: true });
  await expect(heading).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Order placed: ABCDEFGH. You will get an email with the tracking code.");
  expect((await heading.boundingBox())!.y).toBeLessThan((await page.getByRole("status").boundingBox())!.y);
  await photograph(page, testInfo, "checkout-restored-order-placed-heading");
});
