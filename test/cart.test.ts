import { describe, expect, it } from "vitest";
import { type CartLine, cartTotal, checkoutSummary, mergeLines } from "../src/cart.js";

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

  it("handles refund lines with minus sign before currency symbol", () => {
    const lines = [
      { productCode: "ITEM-1", unitPrice: "100,00", quantity: 1 },
      { productCode: "REFUND-1", unitPrice: "-R$ 20,00", quantity: 1 },
    ];
    expect(cartTotal(lines)).toBe(80);
  });

  it("renders checkout summary with refund line", () => {
    const lines = [
      { productCode: "ITEM-1", unitPrice: "50,00", quantity: 2 },
      { productCode: "REFUND-1", unitPrice: "-R$ 12,50", quantity: 1 },
    ];
    expect(checkoutSummary(lines)).toBe("Total: R$ 87,50");
  });
});

describe("mergeLines", () => {
  it("merges two lines of the same code into one", () => {
    const lines = [
      { productCode: "KB-87", unitPrice: "899,90", quantity: 1 },
      { productCode: "KB-87", unitPrice: "899,90", quantity: 2 },
    ];
    expect(mergeLines(lines)).toEqual([{ productCode: "KB-87", unitPrice: "899,90", quantity: 3 }]);
    expect(cartTotal(lines)).toBeCloseTo(2699.7, 2);
  });

  it("keeps the order each code first appears", () => {
    const lines = [
      { productCode: "A", unitPrice: "10,00", quantity: 2 },
      { productCode: "B", unitPrice: "5,50", quantity: 1 },
      { productCode: "A", unitPrice: "10,00", quantity: 3 },
    ];
    expect(mergeLines(lines)).toEqual([
      { productCode: "A", unitPrice: "10,00", quantity: 5 },
      { productCode: "B", unitPrice: "5,50", quantity: 1 },
    ]);
    expect(cartTotal(lines)).toBeCloseTo(55.5, 2);
  });

  it("does not change the input lines", () => {
    const lines = [
      { productCode: "A", unitPrice: "10,00", quantity: 2 },
      { productCode: "A", unitPrice: "10,00", quantity: 3 },
    ];
    mergeLines(lines);
    expect(lines[0]).toEqual({ productCode: "A", unitPrice: "10,00", quantity: 2 });
    expect(lines[1]).toEqual({ productCode: "A", unitPrice: "10,00", quantity: 3 });
  });

  it("refuses two prices for one code", () => {
    const lines = [
      { productCode: "KB-87", unitPrice: "899,90", quantity: 1 },
      { productCode: "KB-87", unitPrice: "849,90", quantity: 1 },
    ];
    const message = "product code KB-87 has two prices: 899,90 and 849,90";
    expect(() => cartTotal(lines)).toThrow(RangeError);
    expect(() => cartTotal(lines)).toThrow(message);
    expect(() => mergeLines(lines)).toThrow(RangeError);
    expect(() => mergeLines(lines)).toThrow(message);
  });

  it("merges prices that are equal after parsing", () => {
    const lines = [
      { productCode: "KB-87", unitPrice: "899,90", quantity: 1 },
      { productCode: "KB-87", unitPrice: "R$ 899,90", quantity: 1 },
    ];
    expect(mergeLines(lines)).toEqual([{ productCode: "KB-87", unitPrice: "899,90", quantity: 2 }]);
    expect(cartTotal(lines)).toBeCloseTo(1799.8, 2);
  });

  it("throws when a repeated code has a later zero quantity", () => {
    const lines = [
      { productCode: "A", unitPrice: "10,00", quantity: 2 },
      { productCode: "A", unitPrice: "10,00", quantity: 0 },
    ];
    expect(() => mergeLines(lines)).toThrow(RangeError);
    expect(() => mergeLines(lines)).toThrow(/quantity for product code A must be a positive integer/);
    expect(() => cartTotal(lines)).toThrow(/quantity for product code A must be a positive integer/);
  });

  it("throws on a negative quantity instead of merging it away", () => {
    const lines = [
      { productCode: "A", unitPrice: "10,00", quantity: -2 },
      { productCode: "A", unitPrice: "10,00", quantity: 3 },
    ];
    expect(() => mergeLines(lines)).toThrow(/quantity for product code A must be a positive integer/);
    expect(() => cartTotal(lines)).toThrow(/quantity for product code A must be a positive integer/);
  });

  it("returns an empty list for an empty cart", () => {
    expect(mergeLines([])).toEqual([]);
  });

  it("throws when lines is not an array", () => {
    expect(() => mergeLines(null as unknown as CartLine[])).toThrow(TypeError);
    expect(() => mergeLines(null as unknown as CartLine[])).toThrow(/lines must be an array/);
  });
});
