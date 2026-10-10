import { describe, expect, it } from "vitest";
import { type Coupon } from "../src/coupon.js";
import { Money } from "../src/money.js";
import {
  FREE_SHIPPING_FROM,
  freeShipping,
  quoteShipping,
  type ShippingMethod,
  type ShippingRequest,
  shippingNote,
} from "../src/shipping.js";

describe("shipping thresholds", () => {
  it("ships free from R$ 100,00", () => {
    expect(FREE_SHIPPING_FROM).toBe(100);
  });

  it("does not ship free at or below the threshold", () => {
    expect(freeShipping(99.99)).toBe(false);
    expect(freeShipping(100)).toBe(false);
    expect(freeShipping(0)).toBe(false);
  });

  it("ships free just above the threshold", () => {
    expect(freeShipping(100.01)).toBe(true);
    expect(freeShipping(1128.7)).toBe(true);
  });

  it("throws on a negative total", () => {
    expect(() => freeShipping(-0.01)).toThrow(RangeError);
    expect(() => freeShipping(-100)).toThrow(RangeError);
  });

  it("throws on a non-finite total", () => {
    expect(() => freeShipping(NaN)).toThrow(RangeError);
    expect(() => freeShipping(Infinity)).toThrow(RangeError);
    expect(() => freeShipping(-Infinity)).toThrow(RangeError);
  });

  it("notes free shipping when the cart qualifies", () => {
    expect(shippingNote(100.01)).toBe("Free shipping");
  });

  it("notes the amount needed to reach R$ 100,01 when the cart does not qualify", () => {
    expect(shippingNote(100)).toBe("Add R$ 0,01 more for free shipping");
    expect(shippingNote(99.99)).toBe("Add R$ 0,02 more for free shipping");
    expect(shippingNote(0)).toBe("Add R$ 100,01 more for free shipping");
  });

  it("throws on a negative total in the note", () => {
    expect(() => shippingNote(-1)).toThrow(RangeError);
  });
});

describe("quoteShipping", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  const expiresAt = new Date("2030-06-30T23:59:59.999Z");
  const small = Money.fromBRL("50,00");
  const request = (overrides: Partial<ShippingRequest> = {}): ShippingRequest => ({
    method: "standard",
    subtotal: small,
    weightKg: 2,
    ...overrides,
  });
  const freeCoupon: Coupon = { code: "FREESHIP", kind: "free-shipping", expiresAt };
  const percentCoupon: Coupon = { code: "P10", kind: "percent", percent: 10, expiresAt };
  const fixedCoupon: Coupon = { code: "F5", kind: "fixed", amount: Money.fromBRL("5,00"), expiresAt };

  it("quotes standard at 2 kg as R$ 11,00 in 7 to 10 business days", () => {
    expect(quoteShipping(request({ method: "standard" }), now)).toEqual({
      method: "standard",
      cost: new Money(1100),
      businessDays: { min: 7, max: 10 },
    });
  });

  it("quotes express at 2 kg as R$ 27,00 in 2 to 3 business days", () => {
    expect(quoteShipping(request({ method: "express" }), now)).toEqual({
      method: "express",
      cost: new Money(2700),
      businessDays: { min: 2, max: 3 },
    });
  });

  it("quotes scheduled at 2 kg as R$ 16,00 for the selected date", () => {
    expect(quoteShipping(request({ method: "scheduled", deliveryDate: "2026-10-20" }), now)).toEqual({
      method: "scheduled",
      cost: new Money(1600),
      deliveryDate: "2026-10-20",
    });
  });

  it("rounds a fractional weight's rate once to the cent", () => {
    const weightKg = 1.234;
    expect(quoteShipping(request({ method: "standard", weightKg }), now).cost.cents).toBe(1062);
    expect(quoteShipping(request({ method: "express", weightKg }), now).cost.cents).toBe(2623);
    expect(
      quoteShipping(request({ method: "scheduled", weightKg, deliveryDate: "2026-10-20" }), now).cost.cents,
    ).toBe(1562);
  });

  it.each<[string, number]>([
    ["99,99", 1100],
    ["100,00", 1100],
    ["100,01", 0],
  ])("waives standard shipping only above R$ 100,00 at subtotal %s", (subtotal, cents) => {
    const quote = quoteShipping(request({ subtotal: Money.fromBRL(subtotal) }), now);
    expect(quote.cost.cents).toBe(cents);
  });

  it.each<[string, number]>([
    ["99,99", 1600],
    ["100,00", 1600],
    ["100,01", 500],
  ])("keeps the scheduling fee and waives base shipping at subtotal %s", (subtotal, cents) => {
    const quote = quoteShipping(
      request({ method: "scheduled", subtotal: Money.fromBRL(subtotal), deliveryDate: "2026-10-20" }),
      now,
    );
    expect(quote.cost.cents).toBe(cents);
  });

  it("never waives express shipping", () => {
    expect(quoteShipping(request({ method: "express", subtotal: Money.fromBRL("100,01") }), now).cost.cents).toBe(
      2700,
    );
    expect(quoteShipping(request({ method: "express", coupon: freeCoupon }), now).cost.cents).toBe(2700);
  });

  it("qualifies on the subtotal before a merchandise discount", () => {
    const quote = quoteShipping(
      request({ subtotal: Money.fromBRL("100,01"), coupon: fixedCoupon }),
      now,
    );
    expect(quote.cost.cents).toBe(0);
  });

  it("does not waive shipping for a percentage or fixed coupon", () => {
    expect(quoteShipping(request({ coupon: percentCoupon }), now).cost.cents).toBe(1100);
    expect(quoteShipping(request({ coupon: fixedCoupon }), now).cost.cents).toBe(1100);
  });

  it("waives standard and scheduled base shipping with a free-shipping coupon", () => {
    expect(quoteShipping(request({ coupon: freeCoupon }), now).cost.cents).toBe(0);
    expect(
      quoteShipping(request({ method: "scheduled", coupon: freeCoupon, deliveryDate: "2026-10-20" }), now).cost
        .cents,
    ).toBe(500);
  });

  it("accepts a free-shipping coupon exactly at its expiry instant", () => {
    expect(quoteShipping(request({ coupon: freeCoupon }), expiresAt).cost.cents).toBe(0);
  });

  it("refuses a free-shipping coupon one millisecond after its expiry", () => {
    const afterExpiry = new Date(expiresAt.getTime() + 1);
    expect(() => quoteShipping(request({ coupon: freeCoupon }), afterExpiry)).toThrow(
      /^coupon FREESHIP expired on 2030-06-30T23:59:59.999Z$/,
    );
    expect(() => quoteShipping(request({ method: "express", coupon: freeCoupon }), afterExpiry)).toThrow(
      /^coupon FREESHIP expired/,
    );
  });

  it.each<ShippingMethod>(["standard", "express", "scheduled"])(
    "refuses an invalid weight for %s",
    (method) => {
      const deliveryDate = "2026-10-20";
      for (const weightKg of [-1, NaN, Infinity]) {
        expect(() => quoteShipping(request({ method, weightKg, deliveryDate }), now)).toThrow(RangeError);
        expect(() => quoteShipping(request({ method, weightKg, deliveryDate }), now)).toThrow(
          /weightKg must be a finite, non-negative number/,
        );
      }
    },
  );

  it("refuses an unknown shipping method", () => {
    const method = "overnight" as unknown as ShippingMethod;
    expect(() => quoteShipping(request({ method }), now)).toThrow(RangeError);
    expect(() => quoteShipping(request({ method }), now)).toThrow(/unknown shipping method: overnight/);
  });

  it("refuses a negative subtotal", () => {
    expect(() => quoteShipping(request({ subtotal: new Money(-1) }), now)).toThrow(RangeError);
    expect(() => quoteShipping(request({ subtotal: new Money(-1) }), now)).toThrow(
      /subtotal must not be negative/,
    );
  });

  it("refuses a subtotal that is not Money", () => {
    const subtotal = 50 as unknown as Money;
    expect(() => quoteShipping(request({ subtotal }), now)).toThrow(TypeError);
  });

  it("refuses a scheduled quote without a delivery date", () => {
    expect(() => quoteShipping(request({ method: "scheduled" }), now)).toThrow(
      /delivery date must be a valid YYYY-MM-DD date: undefined/,
    );
  });

  it.each(["2026-6-1", "10/20/2026", "2026-10-20T00:00:00Z"])(
    "refuses a malformed delivery date %s",
    (deliveryDate) => {
      expect(() => quoteShipping(request({ method: "scheduled", deliveryDate }), now)).toThrow(
        /delivery date must be a valid YYYY-MM-DD date/,
      );
    },
  );

  it("refuses an impossible delivery date", () => {
    expect(() => quoteShipping(request({ method: "scheduled", deliveryDate: "2026-02-30" }), now)).toThrow(
      /delivery date must be a valid YYYY-MM-DD date: 2026-02-30/,
    );
  });

  it("refuses a delivery date that is today or in the past", () => {
    expect(() => quoteShipping(request({ method: "scheduled", deliveryDate: "2026-10-10" }), now)).toThrow(
      /delivery date must be after 2026-10-10: 2026-10-10/,
    );
    expect(() => quoteShipping(request({ method: "scheduled", deliveryDate: "2026-10-09" }), now)).toThrow(
      /delivery date must be after 2026-10-10: 2026-10-09/,
    );
  });

  it("validates the delivery date even when base shipping is waived", () => {
    expect(() =>
      quoteShipping(request({ method: "scheduled", subtotal: Money.fromBRL("150,00"), deliveryDate: "2026-10-09" }), now),
    ).toThrow(/delivery date must be after 2026-10-10/);
    expect(() =>
      quoteShipping(request({ method: "scheduled", coupon: freeCoupon, deliveryDate: "2026-02-30" }), now),
    ).toThrow(/delivery date must be a valid YYYY-MM-DD date/);
  });
});
