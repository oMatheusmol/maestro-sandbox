import { expect, test, type Locator } from "@playwright/test";
import { photograph } from "./screens.js";

async function expectReadableElement(locator: Locator): Promise<void> {
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
    for (const text of await page.locator(selector).all()) await expectReadableElement(text);
  }
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("123");
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.locator("#placed")).toBeEmpty();
  expect(await page.getByLabel("CEP", { exact: true }).evaluate((input: HTMLInputElement) => input.validity.patternMismatch)).toBe(true);
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
  await expectReadableElement(page.getByLabel("Full name"));
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toContainText("Order placed.");
  await expectReadableElement(page.getByRole("status"));
  await photograph(page, testInfo, "checkout");
});

test("keeps recorder instructions and failure feedback readable", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["microphone"]);
  await page.route("/api/notes", (route) => route.fulfill({ status: 503 }));
  await page.goto("/");
  await page.getByRole("link", { name: "Voice note", exact: true }).click();
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 255)");
  await expectReadableElement(page.getByRole("heading", { level: 1 }));
  await expectReadableElement(page.locator(".page > p"));
  await expectReadableElement(page.getByRole("status"));
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Recording…");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Not sent (503). Try again.");
  await expectReadableElement(page.getByRole("status"));
  await expectReadableElement(page.getByLabel("Sent notes").locator("li").first());
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

async function expectReadableText(elements: Locator): Promise<void> {
  const contrasts = await elements.evaluateAll((nodes) => {
    const rgb = (color: string) => color.match(/[\d.]+/g)!.map(Number);
    const luminance = (channels: number[]) => channels.slice(0, 3).reduce((sum, channel, index) => {
      const value = channel / 255;
      return sum + (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index]!;
    }, 0);
    return nodes.map((node) => {
      let surface: Element | null = node;
      let background = "rgba(0, 0, 0, 0)";
      while (surface) {
        background = getComputedStyle(surface).backgroundColor;
        if (rgb(background)[3] !== 0) break;
        surface = surface.parentElement;
      }
      const foreground = luminance(rgb(getComputedStyle(node).color));
      const backdrop = luminance(rgb(background));
      return { text: node.textContent || node.getAttribute("name"), ratio: (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05) };
    });
  });
  expect(contrasts.length).toBeGreaterThan(0);
  for (const { text, ratio } of contrasts) {
    expect.soft(ratio, `Contrast for ${text}`).toBeGreaterThanOrEqual(4.5);
  }
}

test("keeps text readable on blue pages and white cards", async ({ page, context }, testInfo) => {
  await page.goto("/");
  await expectReadableText(page.locator("h1, h2, .shipping label, .total, .free-shipping, .lines li"));
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByLabel("Full name").and(page.locator(":invalid"))).toBeVisible();
  await expect(page.locator("#placed")).toBeEmpty();
  await page.getByLabel("Full name").fill("Alex Example");
  await page.getByLabel("Street and number").fill("Example Street 123");
  await page.getByLabel("CEP", { exact: true }).fill("12345-678");
  await expectReadableText(page.locator(".shipping input"));
  await page.getByRole("button", { name: /Place order and pay/ }).click();
  await expect(page.getByRole("status")).toHaveText("Order placed. You will get an email with the tracking code.");
  await expectReadableText(page.getByRole("status"));
  await photograph(page, testInfo, "checkout");

  await context.grantPermissions(["microphone"]);
  await page.route("/api/notes", (route) => route.fulfill({ status: 503 }));
  await page.getByRole("link", { name: "Voice note", exact: true }).click();
  await expectReadableText(page.locator("h1, .page > p, .status"));
  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Not sent (503). Try again.");
  await expectReadableText(page.locator(".status, .notes li"));
  await photograph(page, testInfo, "recorder");
});

test("keeps the shared page background blue across navigation", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Checkout", exact: true })).toBeVisible();
  await expect.soft(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 255)");
  await photograph(page, testInfo, "checkout");

  await page.getByRole("link", { name: "Voice note", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Voice note", exact: true })).toBeVisible();
  await expect.soft(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 255)");
  await photograph(page, testInfo, "recorder");

  await page.getByRole("link", { name: "Checkout", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Checkout", exact: true })).toBeVisible();
  await expect.soft(page.locator("html")).toHaveCSS("background-color", "rgb(0, 0, 255)");
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
