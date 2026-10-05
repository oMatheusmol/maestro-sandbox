import { describe, expect, it } from "vitest";
import { FREE_SHIPPING_FROM, freeShipping, shippingNote } from "../src/shipping.js";

describe("shipping", () => {
  it("ships free from R$ 500,00", () => {
    expect(FREE_SHIPPING_FROM).toBe(500);
  });

  it("does not ship free just below the threshold", () => {
    expect(freeShipping(499.99)).toBe(false);
    expect(freeShipping(0)).toBe(false);
  });

  it("ships free exactly at the threshold", () => {
    expect(freeShipping(500)).toBe(true);
  });

  it("ships free above the threshold", () => {
    expect(freeShipping(500.01)).toBe(true);
    expect(freeShipping(1128.7)).toBe(true);
  });

  it("throws on a negative total", () => {
    expect(() => freeShipping(-0.01)).toThrow(RangeError);
    expect(() => freeShipping(-500)).toThrow(RangeError);
  });

  it("throws on a non-finite total", () => {
    expect(() => freeShipping(NaN)).toThrow(RangeError);
    expect(() => freeShipping(Infinity)).toThrow(RangeError);
    expect(() => freeShipping(-Infinity)).toThrow(RangeError);
  });

  it("notes free shipping when the cart qualifies", () => {
    expect(shippingNote(500)).toBe("Free shipping");
  });

  it("notes how much is missing when the cart does not qualify", () => {
    expect(shippingNote(499.99)).toBe("Add R$ 0,01 more for free shipping");
    expect(shippingNote(0)).toBe("Add R$ 500,00 more for free shipping");
  });

  it("throws on a negative total in the note", () => {
    expect(() => shippingNote(-1)).toThrow(RangeError);
  });
});
