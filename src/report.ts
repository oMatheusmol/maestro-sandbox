import { cartTotal, type CartLine } from "./cart.js";

/** An order with a unique ID and a list of cart lines. */
export interface Order {
  id: string;
  lines: CartLine[];
}

/** A settlement record with order IDs and the amount paid out by the payment provider. */
export interface Settlement {
  orderIds: string[];
  /** Amount paid out by the payment provider, in BRL. */
  paidOut: number;
}

/** Daily reconciliation: sum of order totals must match the payout exactly. */
export function reconcile(orders: Order[], settlement: Settlement): void {
  const expected = orders
    .filter((o) => settlement.orderIds.includes(o.id))
    .reduce((sum, o) => sum + cartTotal(o.lines), 0);
  const epsilon = 1e-9;
  if (Math.abs(expected - settlement.paidOut) > epsilon) {
    throw new Error(`reconciliation mismatch: expected ${expected}, paid out ${settlement.paidOut}`);
  }
}
