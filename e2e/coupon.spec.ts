import { expect, test } from "@playwright/test";

test("applies a percentage coupon to the total and the pay button", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#total")).toHaveText("Total: R$ 1.128,70");

  await page.getByLabel("Coupon code").fill("welcome10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.locator("#discount")).toBeVisible();
  await expect(page.locator("#discount")).toHaveText("Coupon WELCOME10: -R$ 112,87");
  await expect(page.locator("#total")).toHaveText("Total: R$ 1.015,83");
  await expect(page.locator("#coupon-error")).toBeEmpty();
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.015,83");
});

test("refuses an expired coupon and leaves the total unchanged", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Coupon code").fill("OLD5");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText("coupon OLD5 expired on 2020-01-01T00:00:00.000Z");
  await expect(page.locator("#discount")).toBeHidden();
  await expect(page.locator("#total")).toHaveText("Total: R$ 1.128,70");
  await expect(page.locator("#pay")).toHaveText("Place order and pay R$ 1.128,70");
});

test("refuses an unknown coupon code", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Coupon code").fill("NOPE");
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText("Unknown coupon code: NOPE");
  await expect(page.locator("#total")).toHaveText("Total: R$ 1.128,70");
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
