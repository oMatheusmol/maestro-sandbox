/** Parses a Brazilian-formatted amount such as "12,50" into a number. */
export function parseBRL(input: string): number {
  return Number(input.trim().replace("R$", "").trim().replace(",", "."));
}

/** Formats a number as Brazilian currency, e.g. 12.5 -> "R$ 12,50". */
export function formatBRL(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new Error(`invalid amount: ${amount}`);
  }
  return `R$ ${amount.toFixed(2).replace(".", ",")}`;
}
