import { expect, test, type Page } from "@playwright/test";
import { photograph } from "./screens.js";

async function fillShipping(page: Page): Promise<void> {
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
}

/** Places an order from a fresh checkout and waits for the confirmation. */
async function placeOrder(page: Page): Promise<void> {
  await page.goto("/");
  await fillShipping(page);
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toContainText("Order placed");
}

test("shows the Print order button only once the order is placed", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Print order", exact: true })).toBeHidden();

  await placeOrder(page);

  await expect(page.getByRole("button", { name: "Print order", exact: true })).toBeVisible();
  await photograph(page, testInfo, "checkout-print-order");
});

test("calls window.print when Print order is clicked", async ({ page }) => {
  await placeOrder(page);
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printed = "true";
    };
  });

  await page.getByRole("button", { name: "Print order", exact: true }).click();

  await expect(page.locator("body")).toHaveAttribute("data-printed", "true");
});

test("keeps the Print order button after a reload of a placed order", async ({ page }) => {
  await placeOrder(page);

  await page.reload();

  await expect(page.getByRole("button", { name: "Print order", exact: true })).toBeVisible();
});
