import { expect, test, type Page } from "@playwright/test";
import { ORDER_PLACED } from "./order-placed.js";
import { photograph } from "./screens.js";

/** The made-up demo balance every shopper starts with at checkout. */
const DEMO_POINTS = 1000;

/** The digits of a BRL amount as cents: "Total do pedido: R$ 1.118,70" reads as 111870. */
function centsIn(text: string | null): number {
  return Number((text ?? "").replace(/\D/g, ""));
}

async function fillShipping(page: Page): Promise<void> {
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
}

test("shows the demo balance and a Redeem points button", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 2, name: "Loyalty points", exact: true })).toBeVisible();
  await expect(page.locator("#points-balance")).toHaveText(`Points balance: ${DEMO_POINTS}`);
  const redeem = page.getByRole("button", { name: "Redeem points", exact: true });
  await expect(redeem).toBeEnabled();

  // The section sits above the pay button, and the pay button stays inside the viewport width.
  const viewport = page.viewportSize()!;
  const redeemBox = (await redeem.boundingBox())!;
  const payBox = (await page.locator("#pay").boundingBox())!;
  expect(redeemBox.y + redeemBox.height).toBeLessThanOrEqual(payBox.y);
  expect(payBox.x).toBeGreaterThanOrEqual(0);
  expect(payBox.x + payBox.width).toBeLessThanOrEqual(viewport.width);
});

test("redeeming points takes the points off the total and the pay button", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
  const totalBefore = centsIn(await page.locator("#total").textContent());

  await page.getByRole("button", { name: "Redeem points", exact: true }).click();

  // The subtotal is above the balance, so the whole balance is redeemed as R$ 10,00.
  await expect(page.locator("#discount")).toBeVisible();
  const redeemed = centsIn(await page.locator("#discount").textContent());
  expect(redeemed).toBe(DEMO_POINTS);
  await expect.poll(async () => centsIn(await page.locator("#total").textContent())).toBe(totalBefore - redeemed);
  await expect.poll(async () => centsIn(await page.locator("#pay").textContent())).toBe(totalBefore - redeemed);
  await expect(page.locator("#coupon-error")).toBeEmpty();
  await photograph(page, testInfo, "checkout-points-redeemed");
});

test("applying a coupon code after redeeming removes the points discount", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Redeem points", exact: true }).click();
  await expect(page.locator("#discount")).toContainText("POINTS");

  await page.getByLabel("Coupon code").fill("welcome10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.locator("#discount")).toHaveText("Coupon WELCOME10: -R$ 112,87");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.015,83");
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.015,83 with Standard shipping");
});

test("placing an order shows the points it earned and the reduced balance", async ({ page }, testInfo) => {
  await page.goto("/");
  await fillShipping(page);
  await page.getByRole("button", { name: "Redeem points", exact: true }).click();
  await expect(page.locator("#discount")).toBeVisible();
  const redeemed = centsIn(await page.locator("#discount").textContent());
  const paid = centsIn(await page.locator("#total").textContent());

  await page.getByRole("button", { name: /Place order and pay/ }).click();

  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
  // One point per whole real of the order total, then the balance less the redemption plus those points.
  const earned = Math.floor(paid / 100);
  await expect(page.locator("#points-earned")).toHaveText(`Points earned on this order: ${earned}`);
  await expect(page.locator("#points-balance")).toHaveText(`Points balance: ${DEMO_POINTS - redeemed + earned}`);
  await expect(page.getByRole("button", { name: "Redeem points", exact: true })).toBeDisabled();
  await photograph(page, testInfo, "checkout-points-earned");
});

test("keeps the points balance after a page reload once an order is placed", async ({ page }) => {
  await page.goto("/");
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
  const balance = await page.locator("#points-balance").textContent();
  expect(balance).not.toBe(`Points balance: ${DEMO_POINTS}`);

  await page.reload();

  await expect(page.locator("#points-balance")).toHaveText(balance!);
  await expect(page.getByRole("button", { name: "Redeem points", exact: true })).toBeDisabled();
});
