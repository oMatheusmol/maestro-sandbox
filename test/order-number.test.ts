import { describe, expect, it } from "vitest";
import { ORDER_NUMBER_LENGTH, ORDER_NUMBER_PATTERN, orderNumberFrom } from "../src/order-number.js";

describe("orderNumberFrom", () => {
  it("builds a code of the length from the unambiguous alphabet", () => {
    const number = orderNumberFrom(crypto.getRandomValues(new Uint8Array(ORDER_NUMBER_LENGTH)));
    expect(number).toHaveLength(ORDER_NUMBER_LENGTH);
    expect(number).toMatch(ORDER_NUMBER_PATTERN);
    expect(number).not.toMatch(/[ILOU]/);
  });

  it("maps the lowest and highest character values to the first and last characters", () => {
    expect(orderNumberFrom(new Uint8Array(ORDER_NUMBER_LENGTH).fill(0))).toBe("00000000");
    expect(orderNumberFrom(new Uint8Array(ORDER_NUMBER_LENGTH).fill(255))).toBe("ZZZZZZZZ");
  });

  it("gives the same code for the same random bytes", () => {
    const bytes = Uint8Array.from([1, 40, 77, 130, 200, 3, 99, 254]);
    expect(orderNumberFrom(bytes)).toBe(orderNumberFrom(Uint8Array.from(bytes)));
  });

  it("gives no repeats across 10,000 random codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      codes.add(orderNumberFrom(crypto.getRandomValues(new Uint8Array(ORDER_NUMBER_LENGTH))));
    }
    expect(codes.size).toBe(10_000);
  });

  it("throws when given other than eight bytes", () => {
    expect(() => orderNumberFrom(new Uint8Array(ORDER_NUMBER_LENGTH - 1))).toThrow(RangeError);
    expect(() => orderNumberFrom(new Uint8Array(ORDER_NUMBER_LENGTH + 1))).toThrow(
      /takes 8 random bytes: 9/,
    );
  });
});
