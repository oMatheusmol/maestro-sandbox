import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

/** The browser key the checkout keeps the placed order under. */
const ORDER_KEY = "sandbox-shop:placed-order";

test("shows the captured total after a reload, not the current cart total", async ({ page }, testInfo) => {
  await page.goto("/");
  const saved = {
    number: "ABCDEFGH",
    method: "standard",
    costCents: 0,
    totalCents: 10000,
    balanceAfter: 1000,
  };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });

  await page.reload();

  await expect(page.getByRole("status")).toHaveText("Order placed: ABCDEFGH. You will get an email with the tracking code.");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 100,00");
  await photograph(page, testInfo, "checkout-restored-total");
});

test("keeps the current cart total when the saved order is malformed", async ({ page }, testInfo) => {
  await page.goto("/");

  for (const saved of ["{not json", JSON.stringify({ number: "lowercase", method: "standard", costCents: 0, totalCents: 0 })]) {
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: saved });
    await page.reload();

    await expect(page.locator("#placed")).toBeEmpty();
    await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
  }
  await photograph(page, testInfo, "checkout-malformed-total");
});

test("labels a restored points redemption as points, not as a coupon", async ({ page }, testInfo) => {
  await page.goto("/");
  const saved = {
    number: "ABCDEFGH",
    method: "standard",
    costCents: 0,
    totalCents: 10000,
    balanceAfter: 1000,
    discountLabel: "Coupon POINTS: -R$ 10,00",
    pointsRedeemed: 1000,
  };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });

  await page.reload();

  await expect(page.locator("#discount")).toHaveText("Points redeemed: -R$ 10,00");
  await expect(page.locator("#discount")).not.toContainText("Coupon");
  await photograph(page, testInfo, "checkout-restored-points");
});

test("keeps the current cart total when the saved points redemption is not a whole number", async ({ page }, testInfo) => {
  await page.goto("/");
  const saved = {
    number: "ABCDEFGH",
    method: "standard",
    costCents: 0,
    totalCents: 10000,
    balanceAfter: 1000,
    discountLabel: "Coupon POINTS: -R$ 10,00",
    pointsRedeemed: -5,
  };
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: ORDER_KEY, value: JSON.stringify(saved) });

  await page.reload();

  await expect(page.locator("#placed")).toBeEmpty();
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
  await photograph(page, testInfo, "checkout-invalid-points-redemption");
});
