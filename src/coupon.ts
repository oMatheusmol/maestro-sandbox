import { Money } from "./money.js";

export type Coupon =
  | { code: string; kind: "percent"; percent: number; expiresAt: Date }
  | { code: string; kind: "fixed"; amount: Money; expiresAt: Date }
  | { code: string; kind: "free-shipping"; expiresAt: Date };

/** @throws {Error} When the coupon expired before `now`. */
function assertNotExpired(coupon: Coupon, now: Date): void {
  if (now.getTime() > coupon.expiresAt.getTime()) {
    throw new Error(`coupon ${coupon.code} expired on ${coupon.expiresAt.toISOString()}`);
  }
}

/**
 * The discount a coupon takes off a cart total at the given instant. A discount
 * larger than the total is clamped to the total, so the payable amount is never negative.
 * A free-shipping coupon takes no merchandise discount.
 * @throws {RangeError} When a percentage is not above 0 and at most 100, or a fixed amount is not above zero.
 * @throws {Error} When the coupon expired before `now`.
 */
export function discountFor(coupon: Coupon, total: Money, now: Date): Money {
  if (coupon.kind === "percent") {
    if (!(coupon.percent > 0 && coupon.percent <= 100)) {
      throw new RangeError(`percent must be greater than 0 and at most 100: ${coupon.percent}`);
    }
  } else if (coupon.kind === "fixed" && coupon.amount.cents <= 0) {
    throw new RangeError(`fixed amount must be greater than zero: ${coupon.amount.toBRL()}`);
  }
  assertNotExpired(coupon, now);
  if (coupon.kind === "free-shipping") {
    return new Money(0);
  }
  const discount =
    coupon.kind === "percent"
      ? new Money(Math.round((total.cents * coupon.percent) / 100))
      : coupon.amount;
  return discount.cents > total.cents ? total : discount;
}

/**
 * Whether the coupon waives shipping at the given instant. Only a free-shipping coupon qualifies.
 * @throws {Error} When a free-shipping coupon expired before `now`.
 */
export function isFreeShippingEligible(coupon: Coupon, now: Date): boolean {
  if (coupon.kind !== "free-shipping") {
    return false;
  }
  assertNotExpired(coupon, now);
  return true;
}
