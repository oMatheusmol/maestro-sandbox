import { type CartLine, payable } from "./cart.js";
import { Money } from "./money.js";
import { isCalendarDate, type ShippingMethod } from "./shipping.js";

export interface Order {
  id: string;
  lines: CartLine[];
  /** Coupon discount taken off the order's lines; none when absent. */
  discount?: Money;
  /** Shipping captured at checkout; none when absent. */
  shipping?: {
    method: ShippingMethod;
    /** The charge as captured, not recalculated from current rates. */
    cost: Money;
    /** The captured YYYY-MM-DD delivery date; required for scheduled shipping. */
    deliveryDate?: string;
  };
}

export interface Settlement {
  orderIds: string[];
  /** Amount paid out by the payment provider. */
  paidOut: Money;
}

/**
 * The amount an order owes: its lines less its discount, plus its captured shipping cost.
 * @throws {TypeError} When the shipping is not an object or its cost is not Money.
 * @throws {RangeError} When the cost is negative, the method is unknown, or a delivery
 *   date is missing (scheduled only), malformed or impossible.
 */
export function orderTotal(order: Order): Money {
  const merchandise = payable(order.lines, order.discount ?? new Money(0));
  const { shipping } = order;
  if (shipping === undefined) {
    return merchandise;
  }
  if (!shipping || typeof shipping !== "object") {
    throw new TypeError(`shipping must be an object: ${shipping}`);
  }
  if (!(shipping.cost instanceof Money)) {
    throw new TypeError(`shipping.cost must be Money: ${shipping.cost}`);
  }
  if (shipping.cost.cents < 0) {
    throw new RangeError(`shipping.cost must not be negative: ${shipping.cost.toBRL()}`);
  }
  if (!["standard", "express", "scheduled"].includes(shipping.method)) {
    throw new RangeError(`unknown shipping method: ${shipping.method}`);
  }
  const { deliveryDate } = shipping;
  const dateRequired = shipping.method === "scheduled" || deliveryDate !== undefined;
  if (dateRequired && (typeof deliveryDate !== "string" || !isCalendarDate(deliveryDate))) {
    throw new RangeError(`delivery date must be a valid YYYY-MM-DD date: ${deliveryDate}`);
  }
  return merchandise.add(shipping.cost);
}

/**
 * Daily reconciliation: sum of order totals must match the payout exactly.
 * @throws {Error} When the settlement names unknown orders, names an order twice,
 *   or its payout does not match the orders' total.
 * @throws {TypeError} When a selected order's shipping is malformed.
 * @throws {RangeError} When a selected order's shipping has an invalid cost, method or date.
 */
export function reconcile(orders: Order[], settlement: Settlement): void {
  if (!Array.isArray(orders)) {
    throw new TypeError(`orders must be an array: ${typeof orders}`);
  }
  if (!settlement || typeof settlement !== "object") {
    throw new TypeError(`settlement must be an object: ${typeof settlement}`);
  }
  if (!Array.isArray(settlement.orderIds)) {
    throw new TypeError(`settlement.orderIds must be an array: ${typeof settlement.orderIds}`);
  }
  if (!(settlement.paidOut instanceof Money)) {
    throw new TypeError(`settlement.paidOut must be Money: ${settlement.paidOut}`);
  }
  const known = new Set(orders.map((o) => o.id));
  const unknown = [...new Set(settlement.orderIds.filter((id) => !known.has(id)))];
  if (unknown.length > 0) {
    throw new Error(`settlement names unknown orders: ${unknown.join(", ")}`);
  }
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const id of settlement.orderIds) {
    if (seen.has(id) && !dupes.includes(id)) dupes.push(id);
    seen.add(id);
  }
  if (dupes.length > 0) {
    throw new Error(`settlement names an order twice: ${dupes.join(", ")}`);
  }
  const expected = orders
    .filter((o) => settlement.orderIds.includes(o.id))
    .reduce((sum, o) => sum.add(orderTotal(o)), new Money(0));
  if (expected.cents !== settlement.paidOut.cents) {
    throw new Error(
      `reconciliation mismatch: expected ${expected.toBRL()}, paid out ${settlement.paidOut.toBRL()}`,
    );
  }
}
