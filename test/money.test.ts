import { describe, expect, it } from "vitest";
import { formatBRL, parseBRL } from "../src/money.js";

describe("money", () => {
  it("parses a simple amount", () => {
    expect(parseBRL("12,50")).toBe(12.5);
  });

  it("parses an amount with the currency symbol", () => {
    expect(parseBRL("R$ 3,00")).toBe(3);
  });

  it("parses an amount with a thousands separator", () => {
    expect(parseBRL("1.234,56")).toBe(1234.56);
  });

  it("parses an amount with several thousands separators and the currency symbol", () => {
    expect(parseBRL("R$ 1.234.567,89")).toBe(1234567.89);
  });

  it("returns NaN for invalid input", () => {
    expect(parseBRL("abc")).toBeNaN();
  });

  it("formats an amount", () => {
    expect(formatBRL(12.5)).toBe("R$ 12,50");
  });
});
