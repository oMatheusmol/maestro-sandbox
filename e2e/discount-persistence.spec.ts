import { expect, test, type Page } from "@playwright/test";
import { photograph } from "./screens.js";

/** The browser key the checkout keeps an unplaced discount under. */
const DISCOUNT_KEY = "sandbox-shop:pending-discount";

async function fillShipping(page: Page): Promise<void> {
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
}

async function placeOrder(page: Page): Promise<void> {
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toContainText("Order placed: ");
}

test("keeps the coupon discount on a placed order after a page reload", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByLabel("Coupon code").fill("welcome10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator("#discount")).toHaveText("Coupon WELCOME10: -R$ 112,87");
  await placeOrder(page);

  await page.reload();

  await expect(page.locator("#discount")).toBeVisible();
  await expect(page.locator("#discount")).toHaveText("Coupon WELCOME10: -R$ 112,87");
  await photograph(page, testInfo, "checkout-coupon-kept");
});

test("keeps the points discount on a placed order after a page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Redeem points", exact: true }).click();
  await placeOrder(page);

  await page.reload();

  await expect(page.locator("#discount")).toBeVisible();
  await expect(page.locator("#discount")).toHaveText("Points redeemed: -R$ 10,00");
});

test("keeps an unplaced points redemption after a page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Redeem points", exact: true }).click();
  const discount = await page.locator("#discount").textContent();
  const total = await page.locator("#total").textContent();

  await page.reload();

  await expect(page.locator("#discount")).toHaveText(discount!);
  await expect(page.locator("#total")).toHaveText(total!);
  await expect(page.getByRole("button", { name: "Redeem points", exact: true })).toBeEnabled();
});

test("keeps an unplaced coupon after a page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Coupon code").fill("welcome10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await page.reload();

  await expect(page.locator("#discount")).toHaveText("Coupon WELCOME10: -R$ 112,87");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.015,83");
});

test("drops a saved unplaced coupon that is no longer accepted", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ code: "OLD5" })), DISCOUNT_KEY);

  await page.reload();

  await expect(page.locator("#discount")).toBeHidden();
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
  expect(await page.evaluate((key) => localStorage.getItem(key), DISCOUNT_KEY)).toBeNull();
});

test("ignores a malformed saved unplaced discount", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((key) => localStorage.setItem(key, "{not json"), DISCOUNT_KEY);

  await page.reload();

  await expect(page.locator("#discount")).toBeHidden();
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
  expect(await page.evaluate((key) => localStorage.getItem(key), DISCOUNT_KEY)).toBeNull();
});
