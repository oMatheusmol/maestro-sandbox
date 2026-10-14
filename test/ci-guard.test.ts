import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
test.runIf(process.env.GITHUB_ACTIONS === "true")("changelog mentions every new export", () => {
  expect(readFileSync("CHANGELOG.md", "utf8")).toContain("pageRange");
});
