import { describe, expect, it } from "vitest";
import config from "../playwright.config.js";

describe("playwright config", () => {
  it("keeps a trace on failure", () => {
    expect(config.use?.trace).toBe("retain-on-failure");
  });

  it("keeps a screenshot on failure", () => {
    expect(config.use?.screenshot).toBe("only-on-failure");
  });
});
