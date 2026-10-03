import { formatBRL, parseBRL } from "./money.js";

export interface CartLine {
  productCode: string;
  unitPrice: string;
  quantity: number;
}

/** Sums the cart lines; prices arrive as Brazilian-formatted strings. */
export function cartTotal(lines: CartLine[]): number {
  if (!Array.isArray(lines)) {
    throw new TypeError(`lines must be an array: ${typeof lines}`);
  }
  return lines.reduce((sum, line) => {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new RangeError(`quantity for product code ${line.productCode} must be a positive integer`);
    }
    return sum + parseBRL(line.unitPrice) * line.quantity;
  }, 0);
}

/** Human-readable total shown at checkout. */
export function checkoutSummary(lines: CartLine[]): string {
  return `Total: ${formatBRL(cartTotal(lines))}`;
}
