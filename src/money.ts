/**
 * Parses a Brazilian-formatted amount such as "12,50" or "R$ 1.234,56" into a number.
 * Dots are treated as thousands separators and the comma as the decimal separator.
 */
export function parseBRL(input: string): number {
  return Number(
    input.trim().replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", "."),
  );
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
