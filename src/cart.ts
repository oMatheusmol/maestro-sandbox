import { Money } from "./money.js";

export interface CartLine {
  productCode: string;
  unitPrice: Money;
  quantity: number;
}

export interface WeightedCartLine extends CartLine {
  /** Weight of one unit, in kilograms. */
  unitWeightKg: number;
}

/** Throws a RangeError when the line's quantity is not a positive integer. */
function assertQuantity(line: CartLine): void {
  if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
    throw new RangeError(`quantity for product code ${line.productCode} must be a positive integer`);
  }
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
    assertQuantity(line);
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

/**
 * The cart weight in kilograms: each line's quantity times its unit weight.
 * Every line is validated before summing, and repeated product codes are counted
 * line by line. Throws a RangeError when a quantity is not a positive integer or
 * a unit weight is not a finite, non-negative number.
 */
export function cartWeight(lines: WeightedCartLine[]): number {
  if (!Array.isArray(lines)) {
    throw new TypeError(`lines must be an array: ${typeof lines}`);
  }
  for (const line of lines) {
    assertQuantity(line);
    if (!Number.isFinite(line.unitWeightKg) || line.unitWeightKg < 0) {
      throw new RangeError(
        `unit weight for product code ${line.productCode} must be a finite, non-negative number of kilograms: ${line.unitWeightKg}`,
      );
    }
  }
  return lines.reduce((sum, line) => sum + line.quantity * line.unitWeightKg, 0);
}

/** The amount to pay: the cart total less the discount. */
export function payable(lines: CartLine[], discount: Money): Money {
  return cartTotal(lines).subtract(discount);
}

/** Human-readable total shown at checkout, after the discount (none by default). */
export function checkoutSummary(lines: CartLine[], discount: Money = new Money(0)): string {
  return `Total: ${payable(lines, discount).toBRL()}`;
}
