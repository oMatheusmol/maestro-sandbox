import { expect, test, type Locator, type Page } from "@playwright/test";
import { ORDER_PLACED } from "./order-placed.js";
import { photograph } from "./screens.js";

/** A frozen browser clock, so today, tomorrow and past dates are the same in every run. */
const NOW = new Date("2026-10-10T12:00:00Z");

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One delivery option, found by its visible name. */
function option(page: Page, name: string): Locator {
  return page.locator(".delivery .option", { hasText: name });
}

function pay(page: Page): Locator {
  return page.locator("#pay");
}

async function fillShipping(page: Page): Promise<void> {
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
}

async function applyCoupon(page: Page, code: string): Promise<void> {
  await page.getByLabel("Coupon code").fill(code);
  await page.getByRole("button", { name: "Apply", exact: true }).click();
}

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error("element has no box");
  }
  return box;
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.goto("/");
});

test("defaults to standard shipping, free, with the date disabled", async ({ page }) => {
  await expect(option(page, "Standard").getByRole("radio")).toBeChecked();
  await expect(option(page, "Express").getByRole("radio")).not.toBeChecked();
  await expect(page.getByLabel("Delivery date")).toBeDisabled();
  await expect(page.locator("#free-shipping")).toHaveText("Free shipping");
  await expect(page.locator("#free-shipping")).toHaveClass(/\bbadge\b/);
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
  await expect(pay(page)).toHaveText("Place order and pay R$ 1.128,70");
});

test("shows each option with its price and delivery window", async ({ page }) => {
  await expect(option(page, "Standard")).toContainText("7–10 business days");
  await expect(option(page, "Standard").locator(".price")).toHaveText("R$ 0,00");
  await expect(option(page, "Express")).toContainText("2–3 business days");
  await expect(option(page, "Express").locator(".price")).toHaveText("R$ 27,00");
  await expect(option(page, "Scheduled")).toContainText("On the date you choose");
  await expect(option(page, "Scheduled").locator(".price")).toHaveText("R$ 5,00");
});

test("each option recomputes the shipping line, total and pay label", async ({ page }) => {
  await option(page, "Express").click();
  await expect(option(page, "Express").getByRole("radio")).toBeChecked();
  await expect(page.locator("#free-shipping")).toHaveText("Shipping: R$ 27,00");
  await expect(page.locator("#free-shipping")).not.toHaveClass(/\bbadge\b/);
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.155,70");
  await expect(pay(page)).toHaveText("Place order and pay R$ 1.155,70");

  await option(page, "Scheduled").click();
  await expect(page.locator("#free-shipping")).toHaveText("Shipping: R$ 5,00");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.133,70");
  await expect(pay(page)).toHaveText("Place order and pay R$ 1.133,70");

  await option(page, "Standard").click();
  await expect(page.locator("#free-shipping")).toHaveText("Free shipping");
  await expect(page.locator("#free-shipping")).toHaveClass(/\bbadge\b/);
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.128,70");
  await expect(pay(page)).toHaveText("Place order and pay R$ 1.128,70");
});

test("requires a future delivery date for scheduled shipping", async ({ page }) => {
  await option(page, "Scheduled").click();
  const date = page.getByLabel("Delivery date");
  await expect(date).toBeEnabled();
  await expect(date).toHaveAttribute("required", "");
  await expect(date).toHaveAttribute("min", "2026-10-11");
  await expect(date).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#date-error")).toHaveText("Choose a delivery date.");

  await fillShipping(page);
  await pay(page).click();
  await expect(page.locator("#placed")).toBeEmpty();
  await expect(pay(page)).toBeEnabled();

  await date.fill("2026-10-10");
  await expect(page.locator("#date-error")).toHaveText("Choose a date after today (UTC).");
  await pay(page).click();
  await expect(page.locator("#placed")).toBeEmpty();

  await date.fill("2026-10-09");
  await expect(page.locator("#date-error")).toHaveText("Choose a date after today (UTC).");
  await pay(page).click();
  await expect(page.locator("#placed")).toBeEmpty();
  await expect(page.locator("#delivery-details")).toBeHidden();
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.133,70");
});

test("switching away from scheduled drops the date requirement and the date", async ({ page }) => {
  await option(page, "Scheduled").click();
  await expect(page.getByLabel("Delivery date")).toHaveAttribute("required", "");

  await option(page, "Standard").click();
  const date = page.getByLabel("Delivery date");
  await expect(date).toBeDisabled();
  await expect(date).not.toHaveAttribute("required", "");
  await expect(page.locator("#date-error")).toBeEmpty();

  await fillShipping(page);
  await pay(page).click();
  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
  await expect(page.locator("#delivery-details")).toHaveText("Delivery: Standard. Shipping: R$ 0,00. Total: R$ 1.128,70.");
});

test("captures a scheduled order with its date, fee and total, then locks payment", async ({ page }) => {
  await option(page, "Scheduled").click();
  await page.getByLabel("Delivery date").fill("2026-10-20");
  await expect(page.locator("#date-error")).toBeEmpty();
  await fillShipping(page);
  await pay(page).click();

  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
  await expect(page.locator("#delivery-details")).toHaveText(
    "Delivery: Scheduled for 2026-10-20. Shipping: R$ 5,00. Total: R$ 1.133,70.",
  );
  await expect(pay(page)).toBeDisabled();

  // Once captured, the delivery and coupon controls are disabled, and a second submission is ignored.
  await expect(page.getByLabel("Delivery date")).toBeDisabled();
  await expect(option(page, "Express").getByRole("radio")).toBeDisabled();
  await expect(page.getByLabel("Coupon code")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
  await page.evaluate(() => document.querySelector<HTMLFormElement>("#shipping")!.requestSubmit());
  await expect(page.locator("#delivery-details")).toHaveText(
    "Delivery: Scheduled for 2026-10-20. Shipping: R$ 5,00. Total: R$ 1.133,70.",
  );
  await expect(pay(page)).toBeDisabled();
});

test("captures an express order with its charge", async ({ page }) => {
  await option(page, "Express").click();
  await fillShipping(page);
  await pay(page).click();

  await expect(page.locator("#delivery-details")).toHaveText("Delivery: Express. Shipping: R$ 27,00. Total: R$ 1.155,70.");
  await expect(pay(page)).toBeDisabled();
});

test("keeps the captured total when the method is changed after capture", async ({ page }) => {
  await option(page, "Express").click();
  await fillShipping(page);
  await pay(page).click();
  await expect(page.locator("#delivery-details")).toHaveText("Delivery: Express. Shipping: R$ 27,00. Total: R$ 1.155,70.");

  // The method is locked, so the click on the disabled option does not change the selection.
  await option(page, "Standard").click({ force: true });
  await expect(option(page, "Express").getByRole("radio")).toBeChecked();
  await expect(option(page, "Standard").getByRole("radio")).not.toBeChecked();
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.155,70");
  await expect(page.locator("#free-shipping")).toHaveText("Shipping: R$ 27,00");
  await expect(pay(page)).toHaveText("Place order and pay R$ 1.155,70");
  await expect(page.locator("#delivery-details")).toHaveText("Delivery: Express. Shipping: R$ 27,00. Total: R$ 1.155,70.");
});

test("keeps the current quote when a coupon is unknown or expired", async ({ page }) => {
  await option(page, "Express").click();
  await applyCoupon(page, "WELCOME10");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.042,83");

  await applyCoupon(page, "NOPE");
  await expect(page.getByRole("alert")).toHaveText("Unknown coupon code: NOPE");
  await expect(page.locator("#discount")).toHaveText("Coupon WELCOME10: -R$ 112,87");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.042,83");
  await expect(pay(page)).toHaveText("Place order and pay R$ 1.042,83");

  await applyCoupon(page, "OLD5");
  await expect(page.getByRole("alert")).toHaveText("coupon OLD5 expired on 2020-01-01T00:00:00.000Z");
  await expect(page.locator("#discount")).toHaveText("Coupon WELCOME10: -R$ 112,87");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.042,83");
  await expect(pay(page)).toHaveText("Place order and pay R$ 1.042,83");
});

test("applies and replaces free-shipping coupons, keeping express and scheduled charges", async ({ page }) => {
  await option(page, "Express").click();
  await applyCoupon(page, "FREESHIP");
  await expect(page.locator("#discount")).toHaveText("Coupon FREESHIP: free shipping");
  await expect(page.locator("#free-shipping")).toHaveText("Shipping: R$ 27,00");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.155,70");

  await applyCoupon(page, "WELCOME10");
  await expect(page.locator("#discount")).toHaveText("Coupon WELCOME10: -R$ 112,87");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.042,83");

  await applyCoupon(page, "FREESHIP");
  await expect(page.locator("#discount")).toHaveText("Coupon FREESHIP: free shipping");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.155,70");

  await option(page, "Scheduled").click();
  await expect(page.locator("#free-shipping")).toHaveText("Shipping: R$ 5,00");
  await expect(page.locator("#total")).toHaveText("Total do pedido: R$ 1.133,70");
  await expect(pay(page)).toHaveText("Place order and pay R$ 1.133,70");
});

test("fits the delivery controls and pay button in the viewport, with actions after the forms", async ({ page, viewport }, testInfo) => {
  const width = viewport?.width ?? 0;
  expect(width).toBeGreaterThan(0);
  await option(page, "Scheduled").click();

  const controls = [
    option(page, "Standard"),
    option(page, "Express"),
    option(page, "Scheduled"),
    page.getByLabel("Delivery date"),
    pay(page),
  ];
  for (const control of controls) {
    await control.scrollIntoViewIfNeeded();
    await expect(control).toBeVisible();
    const box = await boxOf(control);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  }

  const actions = page.locator(".actions");
  expect(["fixed", "sticky"]).not.toContain(await actions.evaluate((node) => getComputedStyle(node).position));
  const follows = await actions.evaluate((node) => ({
    afterShipping: Boolean(document.querySelector("#shipping")!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING),
    afterCoupon: Boolean(document.querySelector("#coupon")!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING),
  }));
  expect(follows).toEqual({ afterShipping: true, afterCoupon: true });

  const shippingBox = await boxOf(page.locator("#shipping"));
  const couponBox = await boxOf(page.locator("#coupon"));
  const actionsBox = await boxOf(actions);
  expect(couponBox.y).toBeGreaterThanOrEqual(shippingBox.y + shippingBox.height);
  expect(actionsBox.y).toBeGreaterThanOrEqual(couponBox.y + couponBox.height);

  expect(await photograph(page, testInfo, "checkout-shipping")).toMatch(/checkout-shipping\.png$/);
});
