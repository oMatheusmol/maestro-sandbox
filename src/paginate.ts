/** Number of pages needed to show `total` items, `size` per page. */
export function pageCount(total: number, size: number): number {
  if (!Number.isInteger(total) || total < 0) {
    throw new RangeError(`total must be a non-negative integer: ${total}`);
  }
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError(`size must be a positive integer: ${size}`);
  }
  return Math.max(1, Math.ceil(total / size));
}

/** Returns the items of a 1-based page. */
export function getPage<T>(items: T[], page: number, size: number): T[] {
  if (!Array.isArray(items)) {
    throw new TypeError(`items must be an array: ${typeof items}`);
  }
  if (!Number.isInteger(page) || page <= 0) {
    throw new RangeError(`page must be a positive integer: ${page}`);
  }
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError(`size must be a positive integer: ${size}`);
  }
  const pages = pageCount(items.length, size);
  if (page < 1 || page > pages) {
    throw new RangeError(`page ${page} out of range (1..${pages})`);
  }
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}

/** 1-based positions of the first and last item shown on a page; 0 and 0 when empty. */
export function pageRange(
  total: number,
  page: number,
  size: number,
): { first: number; last: number } {
  const pages = pageCount(total, size);
  if (!Number.isInteger(page) || page <= 0) {
    throw new RangeError(`page must be a positive integer: ${page}`);
  }
  if (page > pages) {
    throw new RangeError(`page ${page} out of range (1..${pages})`);
  }
  if (total === 0) {
    return { first: 0, last: 0 };
  }
  return { first: (page - 1) * size + 1, last: Math.min(page * size, total) };
}
