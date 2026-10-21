import { expect, test, type Page } from "@playwright/test";
import { ORDER_PLACED } from "./order-placed.js";
import { photograph } from "./screens.js";

/** The browser key the checkout keeps the placed order under. */
const ORDER_KEY = "sandbox-shop:placed-order";

/** Places an order from a fresh checkout, then waits for the confirmation. */
async function placeOrder(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
}

test("shows a Continue shopping link under the confirmation once an order is placed", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Continue shopping" })).toBeHidden();

  await placeOrder(page);

  await expect(page.locator("#placed + #continue-shopping")).toHaveText("Continue shopping");
  await expect(page.getByRole("link", { name: "Continue shopping" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: "Continue shopping" })).toBeVisible();

  await photograph(page, testInfo, "checkout-continue-shopping");
});

test("Continue shopping clears the confirmation and empties the cart without reloading the page", async ({ page }, testInfo) => {
  await placeOrder(page);
  await page.evaluate(() => {
    (window as Window & { marker?: string }).marker = "kept";
  });

  await page.getByRole("link", { name: "Continue shopping" }).click();

  await expect(page.getByRole("status")).toBeEmpty();
  await expect(page.getByRole("link", { name: "Continue shopping" })).toBeHidden();
  await expect(page.locator("#lines li")).toHaveCount(0);
  await expect(page.locator("#pay")).toBeDisabled();
  await expect(page.getByLabel("Express")).toBeEnabled();
  await expect(page.getByLabel("Coupon code")).toBeEnabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), ORDER_KEY)).toBeNull();
  expect(await page.evaluate(() => (window as Window & { marker?: string }).marker)).toBe("kept");

  await photograph(page, testInfo, "checkout-after-continue-shopping");
});

test("a reload after Continue shopping shows a fresh checkout with the full cart and the points balance", async ({ page }) => {
  await placeOrder(page);
  const balance = await page.locator("#points-balance").textContent();
  await page.getByRole("link", { name: "Continue shopping" }).click();

  await page.reload();

  await expect(page.getByRole("status")).toBeEmpty();
  await expect(page.locator("#lines li")).toHaveCount(3);
  await expect(page.locator("#pay")).toBeEnabled();
  await expect(page.locator("#points-balance")).toHaveText(balance!);
});
