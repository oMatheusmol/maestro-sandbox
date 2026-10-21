/**
 * Returns the calendar date `days` business days after the UTC calendar date of `from`,
 * skipping Saturdays and Sundays, as YYYY-MM-DD.
 * @throws {RangeError} When the day count is negative or not an integer.
 */
export function addBusinessDays(from: Date, days: number): string {
  if (!Number.isInteger(days) || days < 0) {
    throw new RangeError(`days must be a non-negative integer: ${days}`);
  }
  const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  let remaining = days;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      remaining -= 1;
    }
  }
  return date.toISOString().slice(0, 10);
}
