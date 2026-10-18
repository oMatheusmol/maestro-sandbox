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

    const twentyOne = Array.from({ length: 21 }, (_, i) => i + 1);

    it("counts 3 pages for 21 products at 10 per page", () => {
      expect(pageCount(21, 10)).toBe(3);
    });

    it("returns only the last product on page 3 of 21 products", () => {
      expect(getPage(twentyOne, 3, 10)).toEqual([21]);
    });

    it("throws for a page past the last one of 21 products", () => {
      expect(() => getPage(twentyOne, 4, 10)).toThrow(
        new RangeError("page 4 out of range (1..3)"),
      );
    });

    it("reports a next page on page 2 of 21 products and none on page 3", () => {
      expect(hasNextPage(21, 2, 10)).toBe(true);
      expect(hasNextPage(21, 3, 10)).toBe(false);
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

  describe("hasNextPage", () => {
    it("reports a next page on the first page of a multi-page listing", () => {
      expect(hasNextPage(10, 1, 5)).toBe(true);
    });

    it("reports a next page on an intermediate page", () => {
      expect(hasNextPage(15, 2, 5)).toBe(true);
    });

    it("reports no next page on the last page", () => {
      expect(hasNextPage(11, 3, 5)).toBe(false);
    });

    it("reports no next page for an empty listing on page 1", () => {
      expect(hasNextPage(0, 1, 10)).toBe(false);
    });

    it("throws for a page past the last one", () => {
      expect(() => hasNextPage(11, 4, 5)).toThrow(
        new RangeError("page 4 out of range (1..3)"),
      );
    });

    it("throws for page 2 of an empty listing", () => {
      expect(() => hasNextPage(0, 2, 10)).toThrow(
        new RangeError("page 2 out of range (1..1)"),
      );
    });

    it("throws when page is not a positive integer", () => {
      expect(() => hasNextPage(10, 0, 5)).toThrow(RangeError);
      expect(() => hasNextPage(10, 0, 5)).toThrow(/page must be a positive integer/);
      expect(() => hasNextPage(10, 1.5, 5)).toThrow(/page must be a positive integer/);
    });

    it("throws when total is negative or not an integer", () => {
      expect(() => hasNextPage(-1, 1, 5)).toThrow(/total must be a non-negative integer/);
      expect(() => hasNextPage(1.5, 1, 5)).toThrow(/total must be a non-negative integer/);
    });

    it("throws when size is not a positive integer", () => {
      expect(() => hasNextPage(10, 1, 0)).toThrow(RangeError);
      expect(() => hasNextPage(10, 1, 0)).toThrow(/size must be a positive integer/);
    });
  });
});
