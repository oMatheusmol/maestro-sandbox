import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
const pull = /^refs\/pull\/(\d+)\//.exec(process.env.GITHUB_REF ?? "")?.[1];
test.runIf(pull !== undefined)("the changelog names every new export with its pull request", () => {
  expect(readFileSync("CHANGELOG.md", "utf8")).toContain(`pageOffset (#${pull})`);
});
