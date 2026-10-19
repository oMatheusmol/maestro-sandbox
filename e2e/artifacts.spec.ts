import { expect, test } from "@playwright/test";

test("keeps a trace of a failing test", async ({}, testInfo) => {
  expect(testInfo.project.use.trace).toBe("retain-on-failure");
});

test("keeps a screenshot of the page when a test fails", async ({}, testInfo) => {
  expect(testInfo.project.use.screenshot).toBe("only-on-failure");
});
