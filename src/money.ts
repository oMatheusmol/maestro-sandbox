/** Parses a Brazilian-formatted amount (e.g. "12,50" or "R$ 1.234,56") into a number; throws if invalid. */
export function parseBRL(input: string): number {
  const trimmed = input.trim();
  if (trimmed === "" || trimmed === "R$") {
    throw new Error(`invalid amount: ${input}`);
  }
  const result = Number(
    trimmed.replace("R$", "").trim().replace(/\./g, "").replace(",", "."),
  );
  if (!Number.isFinite(result)) {
    throw new Error(`invalid amount: ${input}`);
  }
  return result;
}

/** Formats a number as Brazilian currency with thousands separators (e.g. 12.5 -> "R$ 12,50"); throws if not finite. */
export function formatBRL(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new Error(`invalid amount: ${amount}`);
  }
  const fixed = amount.toFixed(2);
  const sign = fixed.startsWith("-") ? "-" : "";
  const [integer = "", decimals = ""] = fixed.slice(sign.length).split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${sign}${grouped},${decimals}`;
}

/** Represents a monetary amount stored as an integer number of cents. */
export class Money {
  readonly cents: number;

  /** Constructs Money from cents; throws if not an integer. */
  constructor(cents: number) {
    if (!Number.isInteger(cents)) {
      throw new Error(`cents must be an integer: ${cents}`);
    }
    this.cents = cents;
  }

  /** Creates Money from a Brazilian-formatted amount string; throws if invalid. */
  static fromBRL(input: string): Money {
    const amount = parseBRL(input);
    const cents = Math.round(amount * 100);
    return new Money(cents);
  }

  /** Converts to a Brazilian-formatted currency string. */
  toBRL(): string {
    return formatBRL(this.cents / 100);
  }

  /** Adds another Money instance and returns a new instance. */
  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  /** Subtracts another Money instance and returns a new instance. */
  subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  /** Multiplies by a quantity and returns a new instance; throws if quantity is not finite. */
  multiplyBy(quantity: number): Money {
    if (!Number.isFinite(quantity)) {
      throw new Error(`quantity must be a finite number: ${quantity}`);
    }
    return new Money(Math.round(this.cents * quantity));
  }
}
