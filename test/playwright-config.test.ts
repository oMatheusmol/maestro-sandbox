import { expect, it } from "vitest";
import config from "../playwright.config.js";

// The reporters are read from the config, so a run always leaves a JSON report under test-results/.
it("keeps the list reporter and writes a JSON report into test-results/", () => {
  expect(config.reporter).toEqual([
    ["list"],
    ["json", { outputFile: "test-results/report.json" }],
  ]);
});
