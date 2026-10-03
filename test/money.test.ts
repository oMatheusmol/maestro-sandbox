import { describe, expect, it } from "vitest";
import { formatBRL, parseBRL, Money } from "../src/money.js";

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

describe("Money", () => {
  it("constructs from integer cents", () => {
    const m = new Money(1250);
    expect(m.cents).toBe(1250);
  });

  it("throws when constructing with non-integer cents", () => {
    expect(() => new Money(12.5)).toThrow("cents must be an integer");
  });

  it("constructs with negative cents", () => {
    const m = new Money(-500);
    expect(m.cents).toBe(-500);
  });

  it("parses from BRL string", () => {
    const m = Money.fromBRL("12,50");
    expect(m.cents).toBe(1250);
  });

  it("parses from BRL string with currency symbol", () => {
    const m = Money.fromBRL("R$ 3,00");
    expect(m.cents).toBe(300);
  });

  it("parses from BRL string with thousands separators", () => {
    const m = Money.fromBRL("1.234,56");
    expect(m.cents).toBe(123456);
  });

  it("parses from BRL string with negative amount", () => {
    const m = Money.fromBRL("R$ -5,99");
    expect(m.cents).toBe(-599);
  });

  it("throws when parsing invalid BRL string", () => {
    expect(() => Money.fromBRL("invalid")).toThrow("invalid amount");
  });

  it("formats to BRL string", () => {
    const m = new Money(1250);
    expect(m.toBRL()).toBe("R$ 12,50");
  });

  it("formats negative amount to BRL string", () => {
    const m = new Money(-599);
    expect(m.toBRL()).toBe("R$ -5,99");
  });

  it("formats zero to BRL string", () => {
    const m = new Money(0);
    expect(m.toBRL()).toBe("R$ 0,00");
  });

  it("formats large amount to BRL string", () => {
    const m = new Money(123456789);
    expect(m.toBRL()).toBe("R$ 1.234.567,89");
  });

  it("adds two Money instances", () => {
    const a = new Money(1250);
    const b = new Money(750);
    const result = a.add(b);
    expect(result.cents).toBe(2000);
    expect(result).not.toBe(a);
    expect(result).not.toBe(b);
  });

  it("adds negative amount", () => {
    const a = new Money(1000);
    const b = new Money(-300);
    const result = a.add(b);
    expect(result.cents).toBe(700);
  });

  it("subtracts two Money instances", () => {
    const a = new Money(1250);
    const b = new Money(500);
    const result = a.subtract(b);
    expect(result.cents).toBe(750);
    expect(result).not.toBe(a);
    expect(result).not.toBe(b);
  });

  it("subtracts resulting in negative", () => {
    const a = new Money(500);
    const b = new Money(1000);
    const result = a.subtract(b);
    expect(result.cents).toBe(-500);
  });

  it("multiplies by positive quantity", () => {
    const m = new Money(1250);
    const result = m.multiplyBy(3);
    expect(result.cents).toBe(3750);
    expect(result).not.toBe(m);
  });

  it("multiplies by fractional quantity", () => {
    const m = new Money(1000);
    const result = m.multiplyBy(1.5);
    expect(result.cents).toBe(1500);
  });

  it("multiplies by zero", () => {
    const m = new Money(1250);
    const result = m.multiplyBy(0);
    expect(result.cents).toBe(0);
  });

  it("multiplies negative amount", () => {
    const m = new Money(-500);
    const result = m.multiplyBy(2);
    expect(result.cents).toBe(-1000);
  });

  it("throws when multiplying by non-finite quantity", () => {
    const m = new Money(1250);
    expect(() => m.multiplyBy(NaN)).toThrow("quantity must be a finite number");
    expect(() => m.multiplyBy(Infinity)).toThrow("quantity must be a finite number");
  });

  it("round-trips through fromBRL and toBRL", () => {
    const original = "R$ 1.234,56";
    const m = Money.fromBRL(original);
    expect(m.toBRL()).toBe(original);
  });

  it("chains operations", () => {
    const a = Money.fromBRL("10,00");
    const b = Money.fromBRL("5,00");
    const result = a.add(b).multiplyBy(2).subtract(new Money(50));
    expect(result.toBRL()).toBe("R$ 29,50");
  });
});
