import { Money } from "./money.js";

export interface CartLine {
  productCode: string;
  unitPrice: Money;
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
    if (line.unitPrice.cents !== first.unitPrice.cents) {
      const firstPrice = first.unitPrice.toBRL();
      const linePrice = line.unitPrice.toBRL();
      throw new RangeError(
        `product code ${line.productCode} has two prices: ${firstPrice} and ${linePrice}`,
      );
    }
    first.quantity += line.quantity;
  }
  return [...merged.values()];
}

/** Sums the cart lines using integer cents. */
export function cartTotal(lines: CartLine[]): Money {
  return mergeLines(lines).reduce(
    (sum, line) => sum.add(line.unitPrice.multiplyBy(line.quantity)),
    new Money(0),
  );
}

/** Human-readable total shown at checkout. */
export function checkoutSummary(lines: CartLine[]): string {
  return `Total: ${cartTotal(lines).toBRL()}`;
}
