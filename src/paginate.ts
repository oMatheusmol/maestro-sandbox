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

/** Returns the 0-based index of the first item on a 1-based page. */
export function pageOffset(page: number, size: number): number {
  if (!Number.isInteger(page) || page <= 0) {
    throw new RangeError(`page must be a positive integer: ${page}`);
  }
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError(`size must be a positive integer: ${size}`);
  }
  return (page - 1) * size;
}
