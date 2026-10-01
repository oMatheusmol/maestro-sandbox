/** Number of pages needed to show `total` items, `size` per page. */
export function pageCount(total: number, size: number): number {
  return Math.ceil(total / size);
}

/** Returns the items of a 1-based page. */
export function getPage<T>(items: T[], page: number, size: number): T[] {
  const pages = pageCount(items.length, size);
  if (page < 1 || page > pages) {
    throw new RangeError(`page ${page} out of range (1..${pages})`);
  }
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}
