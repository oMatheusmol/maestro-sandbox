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

/**
 * Returns the items of one page as a new array.
 *
 * @param items - The items to split into pages.
 * @param page - The 1-based page number to return.
 * @param size - The number of items per page; must be a positive integer.
 * @returns The items on `page`, which is empty only when `items` is empty.
 * @throws {TypeError} If `items` is not an array.
 * @throws {RangeError} If `page` is not a positive integer, `size` is not a positive integer, or `page` is past the last page.
 */
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

/**
 * Whether a page exists after the given page.
 *
 * @param total - The total number of items.
 * @param page - The 1-based page number to check from.
 * @param size - The number of items per page; must be a positive integer.
 * @returns `true` when a page exists after `page`, `false` when `page` is the last page.
 * @throws {RangeError} If `page` is not a positive integer, `size` is not a positive integer, `total` is not a non-negative integer, or `page` is past the last page.
 */
export function hasNextPage(total: number, page: number, size: number): boolean {
  if (!Number.isInteger(page) || page <= 0) {
    throw new RangeError(`page must be a positive integer: ${page}`);
  }
  const pages = pageCount(total, size);
  if (page > pages) {
    throw new RangeError(`page ${page} out of range (1..${pages})`);
  }
  return page < pages;
}
