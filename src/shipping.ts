import { type Coupon, isFreeShippingEligible } from "./coupon.js";
import { formatBRL, Money } from "./money.js";

/** Cart total, in reais, above which shipping is free. */
export const FREE_SHIPPING_FROM = 100;

/** Whether a cart with this total ships free. Throws a RangeError on a negative or non-finite total. */
export function freeShipping(total: number): boolean {
  if (!Number.isFinite(total) || total < 0) {
    throw new RangeError(`total must be a finite, non-negative number: ${total}`);
  }
  return total > FREE_SHIPPING_FROM;
}

/** The note shown under the checkout total, e.g. "Add R$ 0,01 more for free shipping". */
export function shippingNote(total: number): string {
  if (freeShipping(total)) {
    return "Free shipping";
  }
  return `Add ${formatBRL(FREE_SHIPPING_FROM + 0.01 - total)} more for free shipping`;
}

export type ShippingMethod = "standard" | "express" | "scheduled";

export interface ShippingRequest {
  method: ShippingMethod;
  /** Merchandise subtotal before any merchandise discount. */
  subtotal: Money;
  /** Cart weight in kilograms, e.g. from cartWeight. */
  weightKg: number;
  /** A coupon that may waive standard and scheduled base shipping. */
  coupon?: Coupon;
  /** The selected delivery date as YYYY-MM-DD; required for scheduled shipping. */
  deliveryDate?: string;
}

export interface ShippingQuote {
  method: ShippingMethod;
  cost: Money;
  /** Business days from dispatch to delivery; standard and express only. */
  businessDays?: { min: number; max: number };
  /** The selected delivery date; scheduled only. */
  deliveryDate?: string;
}

interface Rate {
  baseCents: number;
  centsPerKg: number;
  businessDays: { min: number; max: number };
}

const RATES: Record<"standard" | "express", Rate> = {
  standard: { baseCents: 1000, centsPerKg: 50, businessDays: { min: 7, max: 10 } },
  express: { baseCents: 2500, centsPerKg: 100, businessDays: { min: 2, max: 3 } },
};

/** Flat fee, in cents, that scheduled shipping keeps even when its base shipping is waived. */
const SCHEDULING_FEE_CENTS = 500;

/** The rate in cents, rounded once from its base and its weight charge. */
function rateCents(rate: Rate, weightKg: number): number {
  return Math.round(rate.baseCents + rate.centsPerKg * weightKg);
}

/** Whether the text is a real YYYY-MM-DD calendar date, so 2026-02-30 is not. */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * Returns the delivery date when it is a real YYYY-MM-DD calendar date after the
 * UTC calendar date of `now`.
 * @throws {RangeError} When the date is missing, malformed, impossible, today or in the past.
 */
function checkDeliveryDate(deliveryDate: string | undefined, now: Date): string {
  if (deliveryDate === undefined || !isCalendarDate(deliveryDate)) {
    throw new RangeError(`delivery date must be a valid YYYY-MM-DD date: ${deliveryDate}`);
  }
  const today = now.toISOString().slice(0, 10);
  if (deliveryDate <= today) {
    throw new RangeError(`delivery date must be after ${today}: ${deliveryDate}`);
  }
  return deliveryDate;
}

/**
 * Quotes shipping for a method at the given instant. Standard and scheduled base
 * shipping is free when the pre-discount subtotal is above FREE_SHIPPING_FROM or a
 * free-shipping coupon is eligible; express is never free, and scheduled keeps its fee.
 * @throws {TypeError} When the subtotal is not Money.
 * @throws {RangeError} When the method, subtotal, weight or delivery date is invalid.
 * @throws {Error} When a free-shipping coupon expired before `now`.
 */
export function quoteShipping(request: ShippingRequest, now: Date = new Date()): ShippingQuote {
  const { method, subtotal, weightKg, coupon } = request;
  if (!(subtotal instanceof Money)) {
    throw new TypeError(`subtotal must be Money: ${subtotal}`);
  }
  if (subtotal.cents < 0) {
    throw new RangeError(`subtotal must not be negative: ${subtotal.toBRL()}`);
  }
  if (!Number.isFinite(weightKg) || weightKg < 0) {
    throw new RangeError(`weightKg must be a finite, non-negative number: ${weightKg}`);
  }
  if (method !== "standard" && method !== "express" && method !== "scheduled") {
    throw new RangeError(`unknown shipping method: ${method}`);
  }
  const couponWaives = coupon !== undefined && isFreeShippingEligible(coupon, now);
  if (method === "express") {
    return {
      method,
      cost: new Money(rateCents(RATES.express, weightKg)),
      businessDays: { ...RATES.express.businessDays },
    };
  }
  const waived = freeShipping(subtotal.cents / 100) || couponWaives;
  const baseCents = waived ? 0 : rateCents(RATES.standard, weightKg);
  if (method === "standard") {
    return { method, cost: new Money(baseCents), businessDays: { ...RATES.standard.businessDays } };
  }
  return {
    method,
    cost: new Money(baseCents + SCHEDULING_FEE_CENTS),
    deliveryDate: checkDeliveryDate(request.deliveryDate, now),
  };
}
