import { cartTotal, type CartLine } from "./cart.js";

export interface Order {
  id: string;
  lines: CartLine[];
}

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
  if (expected !== settlement.paidOut) {
    throw new Error(`reconciliation mismatch: expected ${expected}, paid out ${settlement.paidOut}`);
  }
}
