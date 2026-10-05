import { formatBRL, parseBRL } from "./money.js";

export interface CartLine {
  productCode: string;
  unitPrice: string;
  quantity: number;
}

/**
 * Merges lines with the same product code, adding their quantities, in the
 * order each code first appears. Throws a RangeError when a quantity is not a
 * positive integer or when one code carries two different prices.
 */
export function mergeLines(lines: CartLine[]): CartLine[] {
  if (!Array.isArray(lines)) {
    throw new TypeError(`lines must be an array: ${typeof lines}`);
  }
  const merged = new Map<string, CartLine>();
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new RangeError(`quantity for product code ${line.productCode} must be a positive integer`);
    }
    const first = merged.get(line.productCode);
    if (!first) {
      merged.set(line.productCode, { ...line });
      continue;
    }
    if (parseBRL(line.unitPrice) !== parseBRL(first.unitPrice)) {
      throw new RangeError(
        `product code ${line.productCode} has two prices: ${first.unitPrice} and ${line.unitPrice}`,
      );
    }
    first.quantity += line.quantity;
  }
  return [...merged.values()];
}

/** Sums the cart lines; prices arrive as Brazilian-formatted strings. */
export function cartTotal(lines: CartLine[]): number {
  return mergeLines(lines).reduce((sum, line) => sum + parseBRL(line.unitPrice) * line.quantity, 0);
}

/** Human-readable total shown at checkout. */
export function checkoutSummary(lines: CartLine[]): string {
  return `Total: ${formatBRL(cartTotal(lines))}`;
}
