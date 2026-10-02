/** Number of pages needed to show `total` items, `size` per page. */
export function pageCount(total: number, size: number): number {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError(`page size must be a positive integer, got ${size}`);
  }
  return Math.max(1, Math.ceil(total / size));
}

/** Returns the items of a 1-based page. */
export function getPage<T>(items: T[], page: number, size: number): T[] {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError(`page size must be a positive integer, got ${size}`);
  }
  const pages = pageCount(items.length, size);
  if (page < 1 || page > pages) {
    throw new RangeError(`page ${page} out of range (1..${pages})`);
  }
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}
