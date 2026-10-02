import { describe, expect, it } from "vitest";
import { getPage, pageCount } from "../src/paginate.js";

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

  describe("invalid page size", () => {
    it("pageCount throws with size 0", () => {
      expect(() => pageCount(10, 0)).toThrow(
        new RangeError("page size must be a positive integer, got 0"),
      );
    });

    it("pageCount throws with negative size", () => {
      expect(() => pageCount(10, -5)).toThrow(
        new RangeError("page size must be a positive integer, got -5"),
      );
    });

    it("pageCount throws with non-integer size", () => {
      expect(() => pageCount(10, 0.5)).toThrow(
        new RangeError("page size must be a positive integer, got 0.5"),
      );
    });

    it("getPage throws with size 0", () => {
      expect(() => getPage(items, 1, 0)).toThrow(
        new RangeError("page size must be a positive integer, got 0"),
      );
    });

    it("getPage throws with negative size", () => {
      expect(() => getPage(items, 1, -5)).toThrow(
        new RangeError("page size must be a positive integer, got -5"),
      );
    });

    it("getPage throws with non-integer size", () => {
      expect(() => getPage(items, 1, 2.5)).toThrow(
        new RangeError("page size must be a positive integer, got 2.5"),
      );
    });
  });
});
