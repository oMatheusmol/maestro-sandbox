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
});
