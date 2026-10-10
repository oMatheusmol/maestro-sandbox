import { Money } from "./money.js";

export type Coupon =
  | { code: string; kind: "percent"; percent: number; expiresAt: Date }
  | { code: string; kind: "fixed"; amount: Money; expiresAt: Date };

/**
 * The discount a coupon takes off a cart total at the given instant. A discount
 * larger than the total is clamped to the total, so the payable amount is never negative.
 * @throws {RangeError} When a percentage is not above 0 and at most 100, or a fixed amount is not above zero.
 * @throws {Error} When the coupon expired before `now`.
 */
export function discountFor(coupon: Coupon, total: Money, now: Date): Money {
  if (coupon.kind === "percent") {
    if (!(coupon.percent > 0 && coupon.percent <= 100)) {
      throw new RangeError(`percent must be greater than 0 and at most 100: ${coupon.percent}`);
    }
  } else if (coupon.amount.cents <= 0) {
    throw new RangeError(`fixed amount must be greater than zero: ${coupon.amount.toBRL()}`);
  }
  if (now.getTime() > coupon.expiresAt.getTime()) {
    throw new Error(`coupon ${coupon.code} expired on ${coupon.expiresAt.toISOString()}`);
  }
  const discount =
    coupon.kind === "percent"
      ? new Money(Math.round((total.cents * coupon.percent) / 100))
      : coupon.amount;
  return discount.cents > total.cents ? total : discount;
}
