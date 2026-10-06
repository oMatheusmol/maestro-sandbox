import { expect, test, type Locator } from "@playwright/test";
import { photograph } from "./screens.js";

async function expectReadableText(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  const contrast = await locator.evaluate((element) => {
    const luminance = (color: string) => {
      const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const linear = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
    };
    let background = "rgb(255, 255, 255)";
    for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
      const color = getComputedStyle(ancestor).backgroundColor;
      if (color !== "rgba(0, 0, 0, 0)") {
        background = color;
        break;
      }
    }
    const foreground = luminance(getComputedStyle(element).color);
    const behind = luminance(background);
    return (Math.max(foreground, behind) + 0.05) / (Math.min(foreground, behind) + 0.05);
  });
  expect(contrast, `Text contrast for ${await locator.textContent()}`).toBeGreaterThanOrEqual(4.5);
}

test("keeps checkout text readable on blue and white surfaces", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 255)");
  for (const selector of ["h1", "#cart-title", "#shipping-title", ".total", ".lines li span", ".shipping label", "#free-shipping"]) {
    for (const text of await page.locator(selector).all()) await expectReadableText(text);
  }
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("123");
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.locator("#placed")).toBeEmpty();
  expect(await page.getByLabel("CEP", { exact: true }).evaluate((input: HTMLInputElement) => input.validity.patternMismatch)).toBe(true);
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
  await expectReadableText(page.getByLabel("Full name"));
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toContainText("Order placed.");
  await expectReadableText(page.getByRole("status"));
  await photograph(page, testInfo, "checkout");
});

test("keeps recorder instructions and failure feedback readable", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.route("/api/notes", (route) => route.fulfill({ status: 503 }));
  await page.goto("/");
  await page.getByRole("link", { name: "Voice note", exact: true }).click();
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 255)");
  await expectReadableText(page.getByRole("heading", { level: 1 }));
  await expectReadableText(page.locator(".page > p"));
  await expectReadableText(page.getByRole("status"));
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Recording…");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Not sent (503). Try again.");
  await expectReadableText(page.getByRole("status"));
  await expectReadableText(page.getByLabel("Sent notes").locator("li").first());
  await photograph(page, testInfo, "recorder");
});

/** The shop's screens, each photographed in every viewport. */
const SCREENS = [
  { name: "checkout", path: "/", heading: "Checkout" },
  { name: "recorder", path: "/recorder.html", heading: "Voice note" },
];

test("keeps the app background blue when navigating between screens", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Checkout", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 255)");
  await photograph(page, testInfo, "checkout");

  await page.getByRole("link", { name: "Voice note", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Voice note", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 255)");
  await photograph(page, testInfo, "recorder");

  await page.getByRole("link", { name: "Checkout", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Checkout", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 255)");
  await photograph(page, testInfo, "checkout");
});

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

test("shows the free shipping badge under the total", async ({ page, viewport }, testInfo) => {
  await page.goto("/");

  const note = page.locator("#free-shipping");
  await expect(note).toBeVisible();
  await expect(note).toHaveText("Free shipping");
  await expect(note).toHaveClass(/\bbadge\b/);

  const noteBox = await note.boundingBox();
  const totalBox = await page.locator("#total").boundingBox();
  expect(noteBox).not.toBeNull();
  expect(totalBox).not.toBeNull();
  if (noteBox && totalBox && viewport) {
    expect(noteBox.y).toBeGreaterThanOrEqual(totalBox.y + totalBox.height);
    expect(noteBox.x).toBeGreaterThanOrEqual(0);
    expect(noteBox.x + noteBox.width).toBeLessThanOrEqual(viewport.width);
  }

  await photograph(page, testInfo, "checkout");
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
