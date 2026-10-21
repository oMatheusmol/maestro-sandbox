import { expect, test, type Page } from "@playwright/test";
import { ORDER_PLACED } from "./order-placed.js";
import { photograph } from "./screens.js";

/** A Friday, so five business days land on the next Friday. */
const FRIDAY = new Date("2026-10-23T12:00:00Z");

/** A Saturday, so the count starts after the weekend. */
const SATURDAY = new Date("2026-10-24T12:00:00Z");

async function fillShipping(page: Page): Promise<void> {
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
}

/** Places a standard order from a fresh checkout at the given frozen instant. */
async function placeOrderAt(page: Page, now: Date): Promise<void> {
  await page.clock.setFixedTime(now);
  await page.goto("/");
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
}

test("shows the estimated delivery date under the confirmation after a Friday order", async ({ page }, testInfo) => {
  await placeOrderAt(page, FRIDAY);

  await expect(page.locator("#estimated-delivery")).toHaveText("Estimated delivery: 2026-10-30");
  await photograph(page, testInfo, "checkout-estimated-delivery");
});

test("skips the weekend when the order is placed on a Saturday", async ({ page }) => {
  await placeOrderAt(page, SATURDAY);

  await expect(page.locator("#estimated-delivery")).toHaveText("Estimated delivery: 2026-10-30");
});

test("keeps the estimated delivery date after a page reload", async ({ page }) => {
  await placeOrderAt(page, FRIDAY);

  await page.clock.setFixedTime(new Date("2026-10-28T12:00:00Z"));
  await page.reload();

  await expect(page.getByRole("status")).toHaveText(ORDER_PLACED);
  await expect(page.locator("#estimated-delivery")).toHaveText("Estimated delivery: 2026-10-30");
});

test("shows no estimated delivery before an order is placed", async ({ page }) => {
  await page.clock.setFixedTime(FRIDAY);
  await page.goto("/");

  await expect(page.locator("#estimated-delivery")).toBeHidden();
});
