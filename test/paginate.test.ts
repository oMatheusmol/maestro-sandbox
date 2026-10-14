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
    it("returns true for the first page when more pages exist", () => {
      expect(hasNextPage(10, 1, 5)).toBe(true);
    });

    it("returns false for the last full page", () => {
      expect(hasNextPage(10, 2, 5)).toBe(false);
    });

    it("returns true before a partial last page and false on it", () => {
      expect(hasNextPage(11, 2, 5)).toBe(true);
      expect(hasNextPage(11, 3, 5)).toBe(false);
    });

    it("returns false for page 1 of an empty listing", () => {
      expect(hasNextPage(0, 1, 10)).toBe(false);
    });

    it("throws for page 0", () => {
      expect(() => hasNextPage(10, 0, 5)).toThrow(RangeError);
      expect(() => hasNextPage(10, 0, 5)).toThrow(/page must be a positive integer/);
    });

    it("throws for a page past the last one", () => {
      expect(() => hasNextPage(10, 3, 5)).toThrow(
        new RangeError("page 3 out of range (1..2)"),
      );
    });

    it("throws for page 2 of an empty listing", () => {
      expect(() => hasNextPage(0, 2, 10)).toThrow(
        new RangeError("page 2 out of range (1..1)"),
      );
    });

    it("throws when total is negative", () => {
      expect(() => hasNextPage(-1, 1, 5)).toThrow(RangeError);
      expect(() => hasNextPage(-1, 1, 5)).toThrow(/total must be a non-negative integer/);
    });

    it("throws when size is 0", () => {
      expect(() => hasNextPage(10, 1, 0)).toThrow(RangeError);
      expect(() => hasNextPage(10, 1, 0)).toThrow(/size must be a positive integer/);
    });

    it("throws when page is a non-integer", () => {
      expect(() => hasNextPage(10, 1.5, 5)).toThrow(RangeError);
      expect(() => hasNextPage(10, 1.5, 5)).toThrow(/page must be a positive integer/);
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
