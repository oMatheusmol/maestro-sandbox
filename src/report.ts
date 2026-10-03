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
  if (!Array.isArray(orders)) {
    throw new TypeError(`orders must be an array: ${typeof orders}`);
  }
  if (!settlement || typeof settlement !== "object") {
    throw new TypeError(`settlement must be an object: ${typeof settlement}`);
  }
  if (!Array.isArray(settlement.orderIds)) {
    throw new TypeError(`settlement.orderIds must be an array: ${typeof settlement.orderIds}`);
  }
  if (!Number.isFinite(settlement.paidOut)) {
    throw new TypeError(`settlement.paidOut must be a finite number: ${settlement.paidOut}`);
  }
  const expected = orders
    .filter((o) => settlement.orderIds.includes(o.id))
    .reduce((sum, o) => sum + cartTotal(o.lines), 0);
  const epsilon = 1e-9;
  if (Math.abs(expected - settlement.paidOut) > epsilon) {
    throw new Error(`reconciliation mismatch: expected ${expected}, paid out ${settlement.paidOut}`);
  }
}
