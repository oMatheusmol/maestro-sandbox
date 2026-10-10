import { describe, expect, it } from "vitest";
import { type Coupon, discountFor, isFreeShippingEligible } from "../src/coupon.js";
import { Money } from "../src/money.js";

describe("discountFor", () => {
  const money = (value: string) => Money.fromBRL(value);
  const expiresAt = new Date("2030-06-30T23:59:59.999Z");
  const now = new Date("2026-10-10T12:00:00Z");
  const percent = (value: number): Coupon => ({ code: "P10", kind: "percent", percent: value, expiresAt });
  const fixed = (value: string): Coupon => ({ code: "F5", kind: "fixed", amount: money(value), expiresAt });
  const total = money("25,50");

  it("takes a percentage of the total", () => {
    expect(discountFor(percent(10), total, now).cents).toBe(255);
  });

  it("rounds a percentage discount half up to the cent", () => {
    expect(discountFor(percent(15), money("0,10"), now).cents).toBe(2);
  });

  it("accepts a 100 percent coupon, which takes the whole total", () => {
    expect(discountFor(percent(100), total, now).cents).toBe(2550);
  });

  it("takes the fixed amount off the total", () => {
    expect(discountFor(fixed("5,00"), total, now).cents).toBe(500);
  });

  it("clamps a discount larger than the total to the total", () => {
    expect(discountFor(fixed("50,00"), total, now).cents).toBe(2550);
  });

  it("gives a zero discount on a zero-total cart", () => {
    expect(discountFor(percent(10), new Money(0), now).cents).toBe(0);
    expect(discountFor(fixed("5,00"), new Money(0), now).cents).toBe(0);
  });

  it("accepts a coupon exactly at its expiry instant", () => {
    expect(discountFor(percent(10), total, expiresAt).cents).toBe(255);
  });

  it("refuses a coupon one millisecond after its expiry", () => {
    const afterExpiry = new Date(expiresAt.getTime() + 1);
    expect(() => discountFor(percent(10), total, afterExpiry)).toThrow(Error);
    expect(() => discountFor(percent(10), total, afterExpiry)).toThrow(
      /^coupon P10 expired on 2030-06-30T23:59:59.999Z$/,
    );
  });

  it("refuses a percentage of 0", () => {
    expect(() => discountFor(percent(0), total, now)).toThrow(RangeError);
    expect(() => discountFor(percent(0), total, now)).toThrow(
      /percent must be greater than 0 and at most 100: 0/,
    );
  });

  it("refuses a percentage above 100", () => {
    expect(() => discountFor(percent(101), total, now)).toThrow(RangeError);
    expect(() => discountFor(percent(101), total, now)).toThrow(
      /percent must be greater than 0 and at most 100: 101/,
    );
  });

  it("refuses a negative percentage", () => {
    expect(() => discountFor(percent(-5), total, now)).toThrow(RangeError);
    expect(() => discountFor(percent(-5), total, now)).toThrow(
      /percent must be greater than 0 and at most 100: -5/,
    );
  });

  it("refuses a fixed amount of zero", () => {
    expect(() => discountFor(fixed("0,00"), total, now)).toThrow(RangeError);
    expect(() => discountFor(fixed("0,00"), total, now)).toThrow(
      /fixed amount must be greater than zero: R\$ 0,00/,
    );
  });

  it("refuses a negative fixed amount", () => {
    expect(() => discountFor(fixed("-R$ 5,00"), total, now)).toThrow(RangeError);
    expect(() => discountFor(fixed("-R$ 5,00"), total, now)).toThrow(
      /fixed amount must be greater than zero: R\$ -5,00/,
    );
  });
});

describe("free-shipping coupon", () => {
  const money = (value: string) => Money.fromBRL(value);
  const expiresAt = new Date("2030-06-30T23:59:59.999Z");
  const now = new Date("2026-10-10T12:00:00Z");
  const freeShipping: Coupon = { code: "FREESHIP", kind: "free-shipping", expiresAt };
  const percent: Coupon = { code: "P10", kind: "percent", percent: 10, expiresAt };
  const fixed: Coupon = { code: "F5", kind: "fixed", amount: money("5,00"), expiresAt };
  const total = money("25,50");

  it("is eligible for shipping before its expiry", () => {
    expect(isFreeShippingEligible(freeShipping, now)).toBe(true);
  });

  it("is eligible for shipping exactly at its expiry instant", () => {
    expect(isFreeShippingEligible(freeShipping, expiresAt)).toBe(true);
  });

  it("is refused one millisecond after its expiry", () => {
    const afterExpiry = new Date(expiresAt.getTime() + 1);
    expect(() => isFreeShippingEligible(freeShipping, afterExpiry)).toThrow(Error);
    expect(() => isFreeShippingEligible(freeShipping, afterExpiry)).toThrow(
      /^coupon FREESHIP expired on 2030-06-30T23:59:59.999Z$/,
    );
  });

  it("is not eligible for shipping when it is a percentage or fixed coupon", () => {
    expect(isFreeShippingEligible(percent, now)).toBe(false);
    expect(isFreeShippingEligible(fixed, now)).toBe(false);
  });

  it("gives no merchandise discount", () => {
    expect(discountFor(freeShipping, total, now).cents).toBe(0);
    expect(discountFor(freeShipping, total, expiresAt).cents).toBe(0);
  });

  it("refuses a merchandise discount one millisecond after its expiry", () => {
    const afterExpiry = new Date(expiresAt.getTime() + 1);
    expect(() => discountFor(freeShipping, total, afterExpiry)).toThrow(
      /^coupon FREESHIP expired on 2030-06-30T23:59:59.999Z$/,
    );
  });
});
