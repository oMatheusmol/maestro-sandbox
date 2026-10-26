import { expect, test } from "@playwright/test";

test("marks the order total as a polite live region", async ({ page }) => {
  await page.goto("/");
  const total = page.locator("#total");
  await expect(total).toHaveAttribute("aria-live", "polite");
  await expect(total).toHaveAttribute("aria-atomic", "true");
});

test("keeps the live total in step with a shipping change", async ({ page }) => {
  await page.goto("/");
  const total = page.locator("#total");
  const before = await total.textContent();

  await page.locator(".delivery .option", { hasText: "Express" }).click();

  await expect(total).not.toHaveText(before ?? "");
  await expect(total).toHaveAttribute("aria-live", "polite");
});
