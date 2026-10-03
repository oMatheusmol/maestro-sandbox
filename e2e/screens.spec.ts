import { expect, test } from "@playwright/test";
import { photograph } from "./screens.js";

/** The shop's screens, each photographed in every viewport. */
const SCREENS = [
  { name: "checkout", path: "/", heading: "Checkout" },
  { name: "recorder", path: "/recorder.html", heading: "Voice note" },
];

for (const screen of SCREENS) {
  test(`opens the ${screen.name} screen`, async ({ page, viewport }, testInfo) => {
    await page.goto(screen.path);
    await expect(page.getByRole("heading", { level: 1, name: screen.heading })).toBeVisible();

    // On the checkout screen, verify the pay button is fully visible on narrow screens
    if (screen.name === "checkout" && viewport?.width === 375) {
      const payButton = page.locator(".pay");
      await expect(payButton).toBeVisible();

      // Verify the button is not cut off at the right edge
      const payBox = await payButton.boundingBox();
      expect(payBox).not.toBeNull();
      if (payBox) {
        expect(payBox.x + payBox.width).toBeLessThanOrEqual(viewport.width);
      }

      // Verify the total is also visible
      const total = page.locator(".total");
      await expect(total).toBeVisible();
    }

    await photograph(page, testInfo, screen.name);
  });
}

test("keeps the checkout actions footer fixed at the bottom on mobile", async ({ page, viewport }) => {
  if (!viewport) {
    test.skip();
  }

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Checkout" })).toBeVisible();

  const actionsFooter = page.locator(".actions");
  const shippingForm = page.locator(".shipping");

  // Verify the actions footer is initially visible
  await expect(actionsFooter).toBeVisible();

  // Check if we're on mobile (375px) or desktop (1280px)
  const isMobile = viewport!.width === 375;

  if (isMobile) {
    // On mobile, verify the actions footer uses position: fixed
    const position = await actionsFooter.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).toBe("fixed");

    // Get initial Y position of the actions footer
    const initialBox = await actionsFooter.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialY = initialBox?.y ?? 0;

    // Scroll down to see more of the form
    await shippingForm.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      window.scrollBy(0, 200);
    });

    // Verify the actions footer remains visible and stays at the same viewport position after scroll
    const scrolledBox = await actionsFooter.boundingBox();
    expect(scrolledBox).not.toBeNull();

    if (scrolledBox) {
      // With position: fixed, the Y position in the viewport should remain the same
      expect(scrolledBox.y).toBe(initialY);
      // Verify it's still visible at the bottom of the viewport
      expect(scrolledBox.y).toBeGreaterThanOrEqual(0);
      expect(scrolledBox.y + scrolledBox.height).toBeLessThanOrEqual(viewport!.height + 2);
    }

    // Verify the pay button is fully visible and clickable
    const payButton = page.locator(".pay");
    await expect(payButton).toBeVisible();
    const payBox = await payButton.boundingBox();
    expect(payBox).not.toBeNull();
    if (payBox) {
      expect(payBox.x + payBox.width).toBeLessThanOrEqual(viewport!.width);
    }
  } else {
    // On desktop, verify the actions footer is NOT fixed and sits after the form
    const position = await actionsFooter.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).not.toBe("fixed");

    // Verify actions footer appears after the shipping form in the normal document flow
    const shippingBox = await shippingForm.boundingBox();
    const actionsBox = await actionsFooter.boundingBox();

    expect(shippingBox).not.toBeNull();
    expect(actionsBox).not.toBeNull();

    if (shippingBox && actionsBox) {
      // Actions should be below the shipping form
      expect(actionsBox.y).toBeGreaterThanOrEqual(shippingBox.y + shippingBox.height);
    }
  }
});

test("records a voice note with audio data", async ({ page, context }) => {
  await context.grantPermissions(["microphone"]);
  await page.goto("/recorder.html");

  const recordButton = page.getByRole("button", { name: "Record" });
  const stopButton = page.getByRole("button", { name: "Stop" });
  const notesList = page.getByLabel("Sent notes");

  await recordButton.click();
  await expect(stopButton).toBeEnabled();

  await page.waitForTimeout(500);
  await stopButton.click();

  const noteItem = notesList.locator("li").first();
  await expect(noteItem).toContainText(/\d+\.\d+ s · [1-9]\d* KB/);
});
