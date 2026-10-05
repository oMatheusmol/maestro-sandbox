import { formatBRL } from "./money.js";

/** Cart total, in reais, from which shipping is free. */
export const FREE_SHIPPING_FROM = 500;

/** Whether a cart with this total ships free. Throws a RangeError on a negative or non-finite total. */
export function freeShipping(total: number): boolean {
  if (!Number.isFinite(total) || total < 0) {
    throw new RangeError(`total must be a finite, non-negative number: ${total}`);
  }
  return total >= FREE_SHIPPING_FROM;
}

/** The note shown under the checkout total, e.g. "Add R$ 0,01 more for free shipping". */
export function shippingNote(total: number): string {
  if (freeShipping(total)) {
    return "Free shipping";
  }
  return `Add ${formatBRL(FREE_SHIPPING_FROM - total)} more for free shipping`;
}
