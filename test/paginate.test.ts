import { describe, expect, it } from "vitest";
import { getPage, pageCount, pageRange } from "../src/paginate.js";

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

  describe("pageRange", () => {
    it("returns the first and last item of a partial last page", () => {
      expect(pageRange(23, 3, 10)).toEqual({ first: 21, last: 23 });
    });

    it("returns the last item of a full last page", () => {
      expect(pageRange(20, 2, 10)).toEqual({ first: 11, last: 20 });
    });

    it("starts the first page at 1 and ends it at the size or the total", () => {
      expect(pageRange(5, 1, 10)).toEqual({ first: 1, last: 5 });
      expect(pageRange(23, 1, 10)).toEqual({ first: 1, last: 10 });
    });

    it("returns zero for page 1 of an empty listing", () => {
      expect(pageRange(0, 1, 10)).toEqual({ first: 0, last: 0 });
    });

    it("throws for a page past the last one", () => {
      expect(() => pageRange(23, 4, 10)).toThrow(RangeError);
      expect(() => pageRange(23, 4, 10)).toThrow(
        new RangeError("page 4 out of range (1..3)"),
      );
    });

    it("throws for page 2 of an empty listing", () => {
      expect(() => pageRange(0, 2, 10)).toThrow(
        new RangeError("page 2 out of range (1..1)"),
      );
    });

    it("throws when page is zero, negative or not an integer", () => {
      expect(() => pageRange(10, 0, 5)).toThrow(/page must be a positive integer/);
      expect(() => pageRange(10, -1, 5)).toThrow(/page must be a positive integer/);
      expect(() => pageRange(10, 1.5, 5)).toThrow(/page must be a positive integer/);
    });

    it("throws when total is negative", () => {
      expect(() => pageRange(-1, 1, 5)).toThrow(/total must be a non-negative integer/);
    });

    it("throws when size is not a positive integer", () => {
      expect(() => pageRange(10, 1, 0)).toThrow(/size must be a positive integer/);
    });
  });
});
