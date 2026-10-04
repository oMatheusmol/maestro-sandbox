/**
 * Parses a Brazilian-formatted amount such as "12,50" or "R$ 1.234,56" into a number.
 * Dots are treated as thousands separators and the comma as the decimal separator.
 */
export function parseBRL(input: string): number {
  if (typeof input !== "string") {
    throw new TypeError(`input must be a string: ${typeof input}`);
  }
  const noWhitespace = input.replace(/\s/g, "");
  if (noWhitespace === "" || noWhitespace === "R$" || noWhitespace === "-R$") {
    throw new Error(`invalid amount: ${input}`);
  }
  const result = Number(
    noWhitespace.replace("R$", "").replace(/\./g, "").replace(",", "."),
  );
  if (!Number.isFinite(result)) {
    throw new Error(`invalid amount: ${input}`);
  }
  return result;
}

/**
 * Formats a number as Brazilian currency with thousands separators,
 * e.g. 12.5 -> "R$ 12,50" and 1234.56 -> "R$ 1.234,56".
 */
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

export class Money {
  readonly cents: number;

  constructor(cents: number) {
    if (!Number.isInteger(cents)) {
      throw new Error(`cents must be an integer: ${cents}`);
    }
    this.cents = cents;
  }

  static fromBRL(input: string): Money {
    const amount = parseBRL(input);
    const cents = Math.round(amount * 100);
    return new Money(cents);
  }

  toBRL(): string {
    return formatBRL(this.cents / 100);
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  multiplyBy(quantity: number): Money {
    if (!Number.isFinite(quantity)) {
      throw new Error(`quantity must be a finite number: ${quantity}`);
    }
    return new Money(Math.round(this.cents * quantity));
  }
}
