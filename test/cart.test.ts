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
});
