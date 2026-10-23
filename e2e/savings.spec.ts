import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("shows the amount saved with a percentage coupon", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#savings")).toBeHidden();

  await page.getByLabel("Coupon code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.locator("#savings")).toBeVisible();
  await expect(page.locator("#savings")).toHaveText("You save R$ 112,87");
  await photograph(page, testInfo, "checkout-savings-percent");
});

test("shows the amount saved with a fixed coupon", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Coupon code").fill("SAVE50");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.locator("#savings")).toHaveText("You save R$ 50,00");
});

test("shows the amount saved when points are redeemed", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Redeem points", exact: true }).click();

  await expect(page.locator("#savings")).toHaveText("You save R$ 10,00");
});

test("hides the saved amount for a free-shipping coupon", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Coupon code").fill("FREESHIP");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.locator("#discount")).toHaveText("Coupon FREESHIP: free shipping");
  await expect(page.locator("#savings")).toBeHidden();
});

test("keeps the saved amount hidden when the coupon is refused", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Coupon code").fill("OLD5");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText("coupon OLD5 expired on 2020-01-01T00:00:00.000Z");
  await expect(page.locator("#savings")).toBeHidden();
});

test("hides the saved amount again when Clear cart empties the cart", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Coupon code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator("#savings")).toBeVisible();

  await page.getByRole("link", { name: "Clear cart", exact: true }).click();

  await expect(page.locator("#savings")).toBeHidden();
});
