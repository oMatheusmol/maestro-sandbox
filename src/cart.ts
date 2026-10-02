import { formatBRL, parseBRL } from "./money.js";

export interface CartLine {
  sku: string;
  unitPrice: string;
  quantity: number;
}

/** Sums the cart lines; prices arrive as Brazilian-formatted strings. */
export function cartTotal(lines: CartLine[]): number {
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new RangeError(`Invalid quantity for SKU ${line.sku}: quantity must be a positive integer`);
    }
  }
  return lines.reduce((sum, line) => sum + parseBRL(line.unitPrice) * line.quantity, 0);
}

/** Human-readable total shown at checkout. */
export function checkoutSummary(lines: CartLine[]): string {
  return `Total: ${formatBRL(cartTotal(lines))}`;
}
