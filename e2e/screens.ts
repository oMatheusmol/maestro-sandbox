import { join } from "node:path";
import type { Page, TestInfo } from "@playwright/test";

/**
 * Saves the whole page as `<viewport>/<screen>.png`, the viewport being the
 * Playwright project's name: under MAESTRO_SCREENSHOTS when the maestro runs
 * the tests, which keeps them with the run, else under test-results/screens.
 * Screen names are lower case words with dashes, such as `checkout`.
 * Returns the path of the saved file.
 */
export async function photograph(page: Page, testInfo: TestInfo, screen: string): Promise<string> {
  const dir = process.env.MAESTRO_SCREENSHOTS ?? join("test-results", "screens");
  const path = join(dir, testInfo.project.name, `${screen}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}
