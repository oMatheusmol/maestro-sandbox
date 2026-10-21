import { describe, expect, it } from "vitest";
import { addBusinessDays } from "../src/business-days.js";

describe("addBusinessDays", () => {
  it("counts five business days from a Friday to the next Friday", () => {
    expect(addBusinessDays(new Date("2026-10-23T12:00:00Z"), 5)).toBe("2026-10-30");
  });

  it("skips the weekend when the start is a Saturday", () => {
    expect(addBusinessDays(new Date("2026-10-24T12:00:00Z"), 5)).toBe("2026-10-30");
  });

  it("skips the weekend when the start is a Sunday", () => {
    expect(addBusinessDays(new Date("2026-10-25T12:00:00Z"), 5)).toBe("2026-10-30");
  });

  it("counts from a Wednesday across a Friday and a weekend", () => {
    expect(addBusinessDays(new Date("2026-10-21T12:00:00Z"), 5)).toBe("2026-10-28");
  });

  it("counts from the UTC calendar date of the start", () => {
    // 2026-10-22T22:30Z is still Thursday in UTC, so five business days land on 2026-10-29.
    expect(addBusinessDays(new Date("2026-10-23T00:30:00+02:00"), 5)).toBe("2026-10-29");
  });

  it("crosses a month and a year boundary", () => {
    expect(addBusinessDays(new Date("2026-10-28T12:00:00Z"), 5)).toBe("2026-11-04");
    expect(addBusinessDays(new Date("2026-12-30T12:00:00Z"), 5)).toBe("2027-01-06");
  });

  it("returns the start date itself for zero business days", () => {
    expect(addBusinessDays(new Date("2026-10-23T12:00:00Z"), 0)).toBe("2026-10-23");
  });

  it.each([-1, 1.5, NaN])("refuses a day count of %s", (days) => {
    expect(() => addBusinessDays(new Date("2026-10-23T12:00:00Z"), days)).toThrow(RangeError);
  });
});
