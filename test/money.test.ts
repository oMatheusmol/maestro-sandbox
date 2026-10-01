import { describe, expect, it } from "vitest";
import { formatBRL, parseBRL } from "../src/money.js";

describe("money", () => {
  it("parses a simple amount", () => {
    expect(parseBRL("12,50")).toBe(12.5);
  });

  it("parses an amount with the currency symbol", () => {
    expect(parseBRL("R$ 3,00")).toBe(3);
  });

  it("formats an amount", () => {
    expect(formatBRL(12.5)).toBe("R$ 12,50");
  });
});
