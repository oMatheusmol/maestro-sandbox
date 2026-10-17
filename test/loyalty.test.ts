import { describe, expect, it } from "vitest";
import { discountFor } from "../src/coupon.js";
import { CENTS_PER_POINT, POINTS_PER_REAL, pointsCoupon, pointsEarned } from "../src/loyalty.js";
import { Money } from "../src/money.js";

describe("pointsEarned", () => {
  it("earns no points for R$ 0,99", () => {
    expect(pointsEarned(Money.fromBRL("0,99"))).toBe(0);
  });

  it("earns one point for R$ 1,00", () => {
    expect(pointsEarned(Money.fromBRL("1,00"))).toBe(1);
  });

  it("earns 1128 points for R$ 1.128,70", () => {
    expect(pointsEarned(Money.fromBRL("1.128,70"))).toBe(1128);
  });

  it("earns no points for a zero total", () => {
    expect(pointsEarned(new Money(0))).toBe(0);
  });

  it("throws RangeError for negative Money", () => {
    expect(() => pointsEarned(new Money(-100))).toThrow(RangeError);
    expect(() => pointsEarned(new Money(-100))).toThrow(
      /total must not be negative: R\$ -1,00/,
    );
  });

  it("throws TypeError when the total is not Money", () => {
    const notMoney = 10 as unknown as Money;
    expect(() => pointsEarned(notMoney)).toThrow(TypeError);
    expect(() => pointsEarned(notMoney)).toThrow(/total must be a Money: number/);
  });
});

describe("pointsCoupon", () => {
  const expiresAt = new Date("2030-06-30T23:59:59.999Z");
  const now = new Date("2026-10-10T12:00:00Z");

  it("gives a fixed coupon of R$ 2,50 for 250 points", () => {
    expect(pointsCoupon(250, expiresAt)).toEqual({
      code: "POINTS",
      kind: "fixed",
      amount: new Money(250),
      expiresAt,
    });
  });

  it("takes 250 points off a R$ 10,00 total as R$ 2,50", () => {
    const coupon = pointsCoupon(250, expiresAt);
    expect(discountFor(coupon, new Money(1000), now).cents).toBe(250);
  });

  it("values 100 points at R$ 1,00", () => {
    expect(POINTS_PER_REAL).toBe(1);
    expect(CENTS_PER_POINT).toBe(1);
    expect(pointsCoupon(100, expiresAt).amount).toEqual(new Money(100));
  });

  it("throws RangeError for 0 points", () => {
    expect(() => pointsCoupon(0, expiresAt)).toThrow(RangeError);
    expect(() => pointsCoupon(0, expiresAt)).toThrow(
      /points must be a positive integer: 0/,
    );
  });

  it("throws RangeError for negative points", () => {
    expect(() => pointsCoupon(-5, expiresAt)).toThrow(RangeError);
    expect(() => pointsCoupon(-5, expiresAt)).toThrow(
      /points must be a positive integer: -5/,
    );
  });

  it("throws RangeError for fractional points", () => {
    expect(() => pointsCoupon(2.5, expiresAt)).toThrow(RangeError);
    expect(() => pointsCoupon(2.5, expiresAt)).toThrow(
      /points must be a positive integer: 2.5/,
    );
  });

  it("throws RangeError for NaN", () => {
    expect(() => pointsCoupon(Number.NaN, expiresAt)).toThrow(RangeError);
    expect(() => pointsCoupon(Number.NaN, expiresAt)).toThrow(
      /points must be a positive integer: NaN/,
    );
  });
});
