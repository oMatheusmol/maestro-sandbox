import { describe, expect, it } from "vitest";
import { cartTotal, checkoutSummary } from "../src/cart.js";

describe("cart", () => {
  const lines = [
    { productCode: "A", unitPrice: "10,00", quantity: 2 },
    { productCode: "B", unitPrice: "5,50", quantity: 1 },
  ];

  it("sums the lines", () => {
    expect(cartTotal(lines)).toBe(25.5);
  });

  it("renders the checkout summary", () => {
    expect(checkoutSummary(lines)).toBe("Total: R$ 25,50");
  });

  it("renders the checkout summary for prices with a thousands separator", () => {
    expect(checkoutSummary([{ productCode: "C", unitPrice: "1.234,56", quantity: 1 }])).toBe(
      "Total: R$ 1.234,56",
    );
  });

  it("throws on an invalid price", () => {
    expect(() => checkoutSummary([{ productCode: "D", unitPrice: "abc", quantity: 1 }])).toThrow(
      /invalid amount: abc/,
    );
  });

  it("throws on negative quantity", () => {
    expect(() => cartTotal([{ productCode: "A", unitPrice: "10,00", quantity: -2 }])).toThrow(
      RangeError,
    );
    expect(() => cartTotal([{ productCode: "A", unitPrice: "10,00", quantity: -2 }])).toThrow(
      /quantity for product code A must be a positive integer/,
    );
  });

  it("throws on zero quantity", () => {
    expect(() => cartTotal([{ productCode: "B", unitPrice: "5,50", quantity: 0 }])).toThrow(
      RangeError,
    );
    expect(() => cartTotal([{ productCode: "B", unitPrice: "5,50", quantity: 0 }])).toThrow(
      /quantity for product code B must be a positive integer/,
    );
  });

  it("throws on non-integer quantity", () => {
    expect(() => cartTotal([{ productCode: "C", unitPrice: "10,00", quantity: 2.5 }])).toThrow(
      RangeError,
    );
    expect(() => cartTotal([{ productCode: "C", unitPrice: "10,00", quantity: 2.5 }])).toThrow(
      /quantity for product code C must be a positive integer/,
    );
  });

  it("returns zero for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
  });

  it("throws when only a later line is invalid", () => {
    expect(() =>
      cartTotal([
        { productCode: "A", unitPrice: "10,00", quantity: 2 },
        { productCode: "B", unitPrice: "5,50", quantity: 0 },
      ]),
    ).toThrow(/quantity for product code B must be a positive integer/);
  });

  it("throws when lines is not an array", () => {
    expect(() => cartTotal(null as any)).toThrow(TypeError);
    expect(() => cartTotal(null as any)).toThrow(/lines must be an array/);
  });
});
