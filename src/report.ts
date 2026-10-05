import { cartTotal, type CartLine } from "./cart.js";
import { Money } from "./money.js";

export interface Order {
  id: string;
  lines: CartLine[];
}

export interface Settlement {
  orderIds: string[];
  /** Amount paid out by the payment provider. */
  paidOut: Money;
}

/**
 * Daily reconciliation: sum of order totals must match the payout exactly.
 * @throws {Error} When the settlement names unknown orders, names an order twice,
 *   or its payout does not match the orders' total.
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
    .reduce((sum, o) => sum.add(cartTotal(o.lines)), new Money(0));
  if (expected.cents !== settlement.paidOut.cents) {
    throw new Error(
      `reconciliation mismatch: expected ${expected.toBRL()}, paid out ${settlement.paidOut.toBRL()}`,
    );
  }
}
