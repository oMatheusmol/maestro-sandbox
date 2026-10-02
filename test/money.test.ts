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

  it("throws for non-numeric input", () => {
    expect(() => parseBRL("abc")).toThrow("invalid amount: abc");
  });

  it("throws for empty string", () => {
    expect(() => parseBRL("")).toThrow("invalid amount: ");
  });

  it("throws for multiple commas", () => {
    expect(() => parseBRL("1,2,3")).toThrow("invalid amount: 1,2,3");
  });

  it("formats an amount", () => {
    expect(formatBRL(12.5)).toBe("R$ 12,50");
  });

  it("formats an amount with a thousands separator", () => {
    expect(formatBRL(1234.56)).toBe("R$ 1.234,56");
  });

  it("formats an amount with several thousands separators", () => {
    expect(formatBRL(1234567.89)).toBe("R$ 1.234.567,89");
  });

  it("does not add a separator below one thousand", () => {
    expect(formatBRL(999)).toBe("R$ 999,00");
    expect(formatBRL(0)).toBe("R$ 0,00");
  });

  it("formats a negative amount with a thousands separator", () => {
    expect(formatBRL(-1234.5)).toBe("R$ -1.234,50");
  });

  it("throws for non-finite amounts", () => {
    expect(() => formatBRL(NaN)).toThrow("invalid amount");
    expect(() => formatBRL(Infinity)).toThrow("invalid amount");
  });

  it("round-trips through parseBRL", () => {
    expect(parseBRL(formatBRL(1234567.89))).toBe(1234567.89);
  });
});
