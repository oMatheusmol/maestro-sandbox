import { formatBRL, parseBRL } from "./money.js";

/** A line in the shopping cart with SKU, unit price in BRL string format, and quantity. */
export interface CartLine {
  sku: string;
  unitPrice: string;
  quantity: number;
}

/** Sums the cart lines; prices arrive as Brazilian-formatted strings. */
export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new RangeError(`quantity for SKU ${line.sku} must be a positive integer`);
    }
    return sum + parseBRL(line.unitPrice) * line.quantity;
  }, 0);
}

/** Human-readable total shown at checkout. */
export function checkoutSummary(lines: CartLine[]): string {
  return `Total: ${formatBRL(cartTotal(lines))}`;
}
