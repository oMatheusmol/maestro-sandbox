import type { Coupon } from "./coupon.js";
import { Money } from "./money.js";

/** Points earned for each whole real of the paid total. */
export const POINTS_PER_REAL = 1;

/** Value of one point in cents when redeemed: 100 points are R$ 1,00. */
export const CENTS_PER_POINT = 1;

/**
 * The points earned by a paid total: POINTS_PER_REAL for each whole real, with
 * fractional reais dropped.
 * @throws {TypeError} When `total` is not a Money.
 * @throws {RangeError} When `total` is negative.
 */
export function pointsEarned(total: Money): number {
  if (!(total instanceof Money)) {
    throw new TypeError(`total must be a Money: ${typeof total}`);
  }
  if (total.cents < 0) {
    throw new RangeError(`total must not be negative: ${total.toBRL()}`);
  }
  return Math.floor(total.cents / 100) * POINTS_PER_REAL;
}

/**
 * A fixed coupon worth CENTS_PER_POINT cents for each of the given points.
 * The caller supplies `expiresAt`.
 * @throws {RangeError} When `points` is not a positive integer.
 */
export function pointsCoupon(points: number, expiresAt: Date): Extract<Coupon, { kind: "fixed" }> {
  if (!Number.isInteger(points) || points <= 0) {
    throw new RangeError(`points must be a positive integer: ${points}`);
  }
  return {
    code: "POINTS",
    kind: "fixed",
    amount: new Money(points * CENTS_PER_POINT),
    expiresAt,
  };
}
