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
