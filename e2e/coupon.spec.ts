import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

test("applies a percentage coupon to the total and the pay button", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");

  await page.getByLabel("Coupon code").fill("welcome10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.locator("#discount")).toBeVisible();
  await expect(page.locator("#discount")).toHaveText("Coupon WELCOME10: -R$ 112,87");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.015,83");
  await expect(page.locator("#coupon-error")).toBeEmpty();
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.015,83 (Standard)");
});

test("shows the expiry date of the applied coupon", async ({ page }, testInfo) => {
  await page.goto("/");

  await page.getByLabel("Coupon code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.locator("#coupon-expiry")).toBeVisible();
  await expect(page.locator("#coupon-expiry")).toHaveText("Expires 2099-12-31");
  expect(await photograph(page, testInfo, "checkout-coupon-expiry")).toMatch(/checkout-coupon-expiry\.png$/);
});

test("hides the expiry date when the coupon is refused", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Coupon code").fill("OLD5");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText("coupon OLD5 expired on 2020-01-01T00:00:00.000Z");
  await expect(page.locator("#coupon-expiry")).toBeHidden();
});

test("refuses an expired coupon and leaves the total unchanged", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Coupon code").fill("OLD5");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText("coupon OLD5 expired on 2020-01-01T00:00:00.000Z");
  await expect(page.locator("#discount")).toBeHidden();
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.128,70 (Standard)");
});

test("refuses an unknown coupon code", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Coupon code").fill("NOPE");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText("Unknown coupon code: NOPE");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
});

test("moves focus to the coupon field when an unknown code is refused", async ({ page }, testInfo) => {
  await page.goto("/");

  await page.getByLabel("Coupon code").fill("NOPE");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText("Unknown coupon code: NOPE");
  await expect(page.getByLabel("Coupon code")).toBeFocused();
  expect(await photograph(page, testInfo, "checkout-coupon-unknown-focus")).toMatch(/checkout-coupon-unknown-focus\.png$/);
});

test("moves focus to the coupon field when an expired coupon is refused", async ({ page }, testInfo) => {
  await page.goto("/");

  await page.getByLabel("Coupon code").fill("OLD5");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText("coupon OLD5 expired on 2020-01-01T00:00:00.000Z");
  await expect(page.getByLabel("Coupon code")).toBeFocused();
  expect(await photograph(page, testInfo, "checkout-coupon-expired-focus")).toMatch(/checkout-coupon-expired-focus\.png$/);
});

test("takes a percentage coupon off the merchandise before express shipping is added", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Coupon code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.015,83");

  await page.locator(".delivery .option", { hasText: "Express" }).click();
  await expect(page.locator("#free-shipping")).toHaveText("Shipping: R$ 27,00");
  await expect(page.locator("#discount")).toHaveText("Coupon WELCOME10: -R$ 112,87");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.042,83");
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.042,83 (Express)");
});

test("takes a fixed coupon off the merchandise with express shipping already chosen", async ({ page }) => {
  await page.goto("/");
  await page.locator(".delivery .option", { hasText: "Express" }).click();
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.155,70");

  await page.getByLabel("Coupon code").fill("save50");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator("#discount")).toHaveText("Coupon SAVE50: -R$ 50,00");
  await expect(page.locator("#free-shipping")).toHaveText("Shipping: R$ 27,00");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.105,70");
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.105,70 (Express)");
});

test("shows the coupon field and Apply button above the pay button", async ({ page, viewport }) => {
  await page.goto("/");

  const field = page.getByLabel("Coupon code");
  const apply = page.getByRole("button", { name: "Apply", exact: true });
  await expect(field).toBeVisible();
  await expect(apply).toBeVisible();
  await expect(apply).toBeEnabled();

  // The pay button stays inside the viewport width on phone and desktop.
  const payBox = await page.locator("#pay").boundingBox();
  expect(payBox).not.toBeNull();
  if (payBox && viewport) {
    expect(payBox.x).toBeGreaterThanOrEqual(0);
    expect(payBox.x + payBox.width).toBeLessThanOrEqual(viewport.width);
  }
});
