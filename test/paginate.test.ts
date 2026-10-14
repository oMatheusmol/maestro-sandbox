import { describe, expect, it } from "vitest";
import { getPage, pageCount, pageOffset } from "../src/paginate.js";

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

  describe("pageOffset", () => {
    it("returns 0 for the first page", () => {
      expect(pageOffset(1, 10)).toBe(0);
    });

    it("returns the index of the first item on a later page", () => {
      expect(pageOffset(3, 5)).toBe(10);
    });

    it("returns 0 for the first page at size 1", () => {
      expect(pageOffset(1, 1)).toBe(0);
    });

    it("throws when page is not a positive integer", () => {
      expect(() => pageOffset(0, 5)).toThrow(RangeError);
      expect(() => pageOffset(0, 5)).toThrow(/page must be a positive integer/);
      expect(() => pageOffset(-1, 5)).toThrow(/page must be a positive integer/);
      expect(() => pageOffset(1.5, 5)).toThrow(/page must be a positive integer/);
    });

    it("throws when size is not a positive integer", () => {
      expect(() => pageOffset(1, 0)).toThrow(RangeError);
      expect(() => pageOffset(1, 0)).toThrow(/size must be a positive integer/);
      expect(() => pageOffset(1, 2.5)).toThrow(/size must be a positive integer/);
    });
  });
});
