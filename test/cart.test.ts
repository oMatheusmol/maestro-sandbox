import { describe, expect, it } from "vitest";
import { cartTotal, checkoutSummary } from "../src/cart.js";

describe("cart", () => {
  const lines = [
    { sku: "A", unitPrice: "10,00", quantity: 2 },
    { sku: "B", unitPrice: "5,50", quantity: 1 },
  ];

  it("sums the lines", () => {
    expect(cartTotal(lines)).toBe(25.5);
  });

  it("renders the checkout summary", () => {
    expect(checkoutSummary(lines)).toBe("Total: R$ 25,50");
  });

  it("renders the checkout summary for prices with a thousands separator", () => {
    expect(checkoutSummary([{ sku: "C", unitPrice: "1.234,56", quantity: 1 }])).toBe(
      "Total: R$ 1.234,56",
    );
  });

  it("throws on an invalid price", () => {
    expect(() => checkoutSummary([{ sku: "D", unitPrice: "abc", quantity: 1 }])).toThrow(
      /invalid amount: abc/,
    );
  });
});
