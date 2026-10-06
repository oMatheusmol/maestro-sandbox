import { describe, expect, it } from "vitest";
import { getPage, hasNextPage, pageCount } from "../src/paginate.js";

describe("paginate", () => {
  const items = Array.from({ length: 10 }, (_, i) => i + 1);

  it("counts pages", () => {
    expect(pageCount(10, 5)).toBe(2);
  });

  it("returns the requested page", () => {
    expect(getPage(items, 2, 5)).toEqual([6, 7, 8, 9, 10]);
  });

  describe("hasNextPage", () => {
    it.each([
      [10, 1, 5, true],
      [11, 2, 5, true],
      [10, 2, 5, false],
      [11, 3, 5, false],
      [5, 1, 5, false],
      [3, 1, 5, false],
      [0, 1, 5, false],
    ])("checks total %s, page %s, size %s", (total, page, size, expected) => {
      expect(hasNextPage(total, page, size)).toBe(expected);
    });

    it.each([-1, 1.5, NaN, Infinity, -Infinity])(
      "rejects invalid total %s",
      (total) => {
        expect(() => hasNextPage(total, 1, 5)).toThrow(
          new RangeError(`total must be a non-negative integer: ${total}`),
        );
      },
    );

    it.each([0, -1, 1.5, NaN, Infinity, -Infinity])(
      "rejects invalid page %s",
      (page) => {
        expect(() => hasNextPage(10, page, 5)).toThrow(
          new RangeError(`page must be a positive integer: ${page}`),
        );
      },
    );

    it.each([0, -1, 1.5, NaN, Infinity, -Infinity])(
      "rejects invalid size %s",
      (size) => {
        expect(() => hasNextPage(10, 1, size)).toThrow(
          new RangeError(`size must be a positive integer: ${size}`),
        );
      },
    );

    it.each([
      [10, 3, 5, 2],
      [11, 4, 5, 3],
      [0, 2, 5, 1],
    ])("rejects total %s, page %s, size %s outside the range", (total, page, size, pages) => {
      expect(() => hasNextPage(total, page, size)).toThrow(
        new RangeError(`page ${page} out of range (1..${pages})`),
      );
    });
  });

  describe("partial last page", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => i + 1);

    it("counts the partial last page", () => {
      expect(pageCount(11, 5)).toBe(3);
    });

    it("returns the remaining items on the last page", () => {
      expect(getPage(eleven, 3, 5)).toEqual([11]);
    });

    it("throws for a page past the last one", () => {
      expect(() => getPage(eleven, 4, 5)).toThrow(
        new RangeError("page 4 out of range (1..3)"),
      );
    });
  });

  describe("empty listing", () => {
    it("counts one page for empty listing", () => {
      expect(pageCount(0, 10)).toBe(1);
    });

    it("returns empty array for first page of empty listing", () => {
      expect(getPage([], 1, 10)).toEqual([]);
    });

    it("throws for second page of empty listing", () => {
      expect(() => getPage([], 2, 10)).toThrow(
        new RangeError("page 2 out of range (1..1)"),
      );
    });
  });

  describe("validation", () => {
    it("throws when items is not an array", () => {
      expect(() => getPage(null as any, 1, 10)).toThrow(TypeError);
      expect(() => getPage(null as any, 1, 10)).toThrow(/items must be an array/);
    });

    it("throws when page is not a positive integer", () => {
      expect(() => getPage(items, 0, 5)).toThrow(RangeError);
      expect(() => getPage(items, 0, 5)).toThrow(/page must be a positive integer/);
    });

    it("throws when page is negative", () => {
      expect(() => getPage(items, -1, 5)).toThrow(RangeError);
      expect(() => getPage(items, -1, 5)).toThrow(/page must be a positive integer/);
    });

    it("throws when size is not a positive integer", () => {
      expect(() => getPage(items, 1, 0)).toThrow(RangeError);
      expect(() => getPage(items, 1, 0)).toThrow(/size must be a positive integer/);
    });

    it("throws when total is negative in pageCount", () => {
      expect(() => pageCount(-1, 5)).toThrow(RangeError);
      expect(() => pageCount(-1, 5)).toThrow(/total must be a non-negative integer/);
    });

    it("throws when size is not a positive integer in pageCount", () => {
      expect(() => pageCount(10, 0)).toThrow(RangeError);
      expect(() => pageCount(10, 0)).toThrow(/size must be a positive integer/);
    });
  });
});
