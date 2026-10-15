import { describe, expect, it } from "vitest";
import { Money } from "../src/money.js";
import { type Order, reconcile, type Settlement } from "../src/report.js";

describe("reconcile", () => {
  const money = (value: string) => Money.fromBRL(value);

  it("accepts a matching settlement", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("10,00") })).not.toThrow();
  });

  it("reconciles decimal totals with exact cents", () => {
    const orders = [
      {
        id: "o1",
        lines: [
          { productCode: "A", unitPrice: money("0,10"), quantity: 1 },
          { productCode: "B", unitPrice: money("0,20"), quantity: 1 },
        ],
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("0,30") })).not.toThrow();
  });

  it("throws on significant mismatch", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("10,50") })).toThrow(
      /reconciliation mismatch: expected R\$ 10,00, paid out R\$ 10,50/,
    );
  });

  it("throws on an exact cents payout mismatch without tolerance", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("10,01") })).toThrow(
      /^reconciliation mismatch: expected R\$ 10,00, paid out R\$ 10,01$/,
    );
  });

  it("throws naming a settlement id that matches no order", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
    ];
    const settlement = { orderIds: ["o1", "o-9"], paidOut: money("10,00") };
    expect(() => reconcile(orders, settlement)).toThrow(Error);
    expect(() => reconcile(orders, settlement)).toThrow(/^settlement names unknown orders: o-9$/);
  });

  it("names every unknown id in settlement order, before comparing amounts", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
    ];
    const settlement = { orderIds: ["o-9", "o1", "o-12"], paidOut: money("99,00") };
    expect(() => reconcile(orders, settlement)).toThrow(Error);
    expect(() => reconcile(orders, settlement)).toThrow(
      /^settlement names unknown orders: o-9, o-12$/,
    );
  });

  it("throws naming an id the settlement repeats", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
      { id: "o-3", lines: [{ productCode: "B", unitPrice: money("5,00"), quantity: 1 }] },
    ];
    const settlement = { orderIds: ["o-3", "o1", "o-3"], paidOut: money("15,00") };
    expect(() => reconcile(orders, settlement)).toThrow(Error);
    expect(() => reconcile(orders, settlement)).toThrow(/^settlement names an order twice: o-3$/);
  });

  it("lists an unknown id the settlement repeats only once", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
    ];
    const settlement = { orderIds: ["o-9", "o1", "o-9"], paidOut: money("10,00") };
    expect(() => reconcile(orders, settlement)).toThrow(Error);
    expect(() => reconcile(orders, settlement)).toThrow(/^settlement names unknown orders: o-9$/);
  });

  it("lists several repeated ids in the order the repeats happen", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
      { id: "o2", lines: [{ productCode: "B", unitPrice: money("5,00"), quantity: 1 }] },
    ];
    const settlement = { orderIds: ["o2", "o1", "o1", "o2"], paidOut: money("15,00") };
    expect(() => reconcile(orders, settlement)).toThrow(Error);
    expect(() => reconcile(orders, settlement)).toThrow(/^settlement names an order twice: o1, o2$/);
  });

  it("accepts a settlement whose ids all match and still checks its amount", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
      { id: "o2", lines: [{ productCode: "B", unitPrice: money("5,00"), quantity: 2 }] },
      { id: "o3", lines: [{ productCode: "C", unitPrice: money("1,50"), quantity: 1 }] },
    ];
    const orderIds = ["o3", "o1", "o2"];
    expect(() => reconcile(orders, { orderIds, paidOut: money("21,50") })).not.toThrow();
    expect(() => reconcile(orders, { orderIds, paidOut: money("20,00") })).toThrow(
      /^reconciliation mismatch: expected R\$ 21,50, paid out R\$ 20,00$/,
    );
  });

  it("throws when orders is not an array", () => {
    expect(() => reconcile(null as any, { orderIds: [], paidOut: money("0,00") })).toThrow(
      TypeError,
    );
    expect(() => reconcile(null as any, { orderIds: [], paidOut: money("0,00") })).toThrow(
      /orders must be an array/,
    );
  });

  it("throws when settlement is not an object", () => {
    const orders: any[] = [];
    expect(() => reconcile(orders, null as any)).toThrow(TypeError);
    expect(() => reconcile(orders, null as any)).toThrow(/settlement must be an object/);
  });

  it("throws when settlement.orderIds is not an array", () => {
    const orders: any[] = [];
    expect(() => reconcile(orders, { orderIds: null, paidOut: money("0,00") } as any)).toThrow(
      TypeError,
    );
    expect(() => reconcile(orders, { orderIds: null, paidOut: money("0,00") } as any)).toThrow(
      /settlement.orderIds must be an array/,
    );
  });

  it("throws when settlement.paidOut is not Money", () => {
    const orders: any[] = [];
    const settlement = { orderIds: [], paidOut: NaN } as unknown as Settlement;
    expect(() => reconcile(orders, settlement)).toThrow(TypeError);
    expect(() => reconcile(orders, settlement)).toThrow(
      /settlement.paidOut must be Money/,
    );
  });

  it("accepts a settlement that matches the order total after its discount", () => {
    const orders = [
      {
        id: "o1",
        lines: [{ productCode: "A", unitPrice: money("100,00"), quantity: 1 }],
        discount: money("10,00"),
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("90,00") })).not.toThrow();
  });

  it("throws when the payout ignores the order's discount", () => {
    const orders = [
      {
        id: "o1",
        lines: [{ productCode: "A", unitPrice: money("100,00"), quantity: 1 }],
        discount: money("10,00"),
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("100,00") })).toThrow(
      /^reconciliation mismatch: expected R\$ 90,00, paid out R\$ 100,00$/,
    );
  });

  it("adds each captured shipping charge to its discounted merchandise", () => {
    const orders: Order[] = [
      {
        id: "o1",
        lines: [{ productCode: "A", unitPrice: money("100,00"), quantity: 1 }],
        discount: money("10,00"),
        shipping: { method: "standard", cost: money("12,50") },
      },
      {
        id: "o2",
        lines: [{ productCode: "B", unitPrice: money("50,00"), quantity: 1 }],
        shipping: { method: "express", cost: money("25,00") },
      },
      {
        id: "o3",
        lines: [{ productCode: "C", unitPrice: money("20,00"), quantity: 1 }],
        shipping: { method: "scheduled", cost: money("5,00"), deliveryDate: "2026-10-20" },
      },
    ];
    const orderIds = ["o1", "o2", "o3"];
    expect(() => reconcile(orders, { orderIds, paidOut: money("202,50") })).not.toThrow();
    expect(() => reconcile(orders, { orderIds, paidOut: money("190,00") })).toThrow(
      /^reconciliation mismatch: expected R\$ 202,50, paid out R\$ 190,00$/,
    );
  });

  it("reports the exact mismatch when the payout omits a one-cent shipping charge", () => {
    const orders: Order[] = [
      {
        id: "o1",
        lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }],
        shipping: { method: "standard", cost: money("0,01") },
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("10,00") })).toThrow(
      /^reconciliation mismatch: expected R\$ 10,01, paid out R\$ 10,00$/,
    );
  });

  it("accepts zero-cost shipping at the merchandise total", () => {
    const orders: Order[] = [
      {
        id: "o1",
        lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }],
        shipping: { method: "standard", cost: money("0,00") },
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("10,00") })).not.toThrow();
  });

  it("keeps the captured charge and historical date without changing the order", () => {
    const build = (): Order[] => [
      {
        id: "o1",
        lines: [{ productCode: "A", unitPrice: money("40,00"), quantity: 1 }],
        // Captured at checkout; today's rate for this order would be R$ 15,00.
        shipping: { method: "scheduled", cost: money("3,00"), deliveryDate: "2001-01-15" },
      },
    ];
    const orders = build();
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("43,00") })).not.toThrow();
    expect(orders).toEqual(build());
  });

  it("keeps legacy totals unchanged alongside orders with captured shipping", () => {
    const orders: Order[] = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 2 }] },
      {
        id: "o2",
        lines: [{ productCode: "B", unitPrice: money("30,00"), quantity: 1 }],
        shipping: { method: "standard", cost: money("7,00") },
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1", "o2"], paidOut: money("57,00") })).not.toThrow();
  });

  it("leaves the shipping of orders the settlement does not name out of the total", () => {
    const orders: Order[] = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
      {
        id: "o2",
        lines: [{ productCode: "B", unitPrice: money("30,00"), quantity: 1 }],
        shipping: { method: "express", cost: money("25,00") },
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("10,00") })).not.toThrow();
  });

  it("accepts an empty settlement with a zero payout", () => {
    const orders: Order[] = [
      {
        id: "o1",
        lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }],
        shipping: { method: "standard", cost: money("5,00") },
      },
    ];
    expect(() => reconcile(orders, { orderIds: [], paidOut: money("0,00") })).not.toThrow();
  });

  it("throws when an empty settlement pays out a non-zero amount", () => {
    const orders: Order[] = [
      {
        id: "o1",
        lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }],
        shipping: { method: "standard", cost: money("5,00") },
      },
    ];
    expect(() => reconcile(orders, { orderIds: [], paidOut: money("1,00") })).toThrow(
      /^reconciliation mismatch: expected R\$ 0,00, paid out R\$ 1,00$/,
    );
  });

  it("names an unknown id before checking the amount of a shipping-bearing order", () => {
    const orders: Order[] = [
      {
        id: "o1",
        lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }],
        shipping: { method: "standard", cost: money("5,00") },
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1", "o-9"], paidOut: money("0,00") })).toThrow(
      /^settlement names unknown orders: o-9$/,
    );
  });

  it("names a repeated id before checking the amount of a shipping-bearing order", () => {
    const orders: Order[] = [
      {
        id: "o1",
        lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }],
        shipping: { method: "standard", cost: money("5,00") },
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1", "o1"], paidOut: money("0,00") })).toThrow(
      /^settlement names an order twice: o1$/,
    );
  });

  it.each([
    {
      label: "is not an object",
      shipping: "standard",
      error: TypeError,
      message: /^shipping must be an object: standard$/,
    },
    {
      label: "is null",
      shipping: null,
      error: TypeError,
      message: /^shipping must be an object: null$/,
    },
    {
      label: "has a cost that is not Money",
      shipping: { method: "standard", cost: 5 },
      error: TypeError,
      message: /^shipping.cost must be Money: 5$/,
    },
    {
      label: "has a negative cost",
      shipping: { method: "standard", cost: new Money(-250) },
      error: RangeError,
      message: /^shipping.cost must not be negative: R\$ -2,50$/,
    },
    {
      label: "has an unknown method",
      shipping: { method: "overnight", cost: money("5,00") },
      error: RangeError,
      message: /^unknown shipping method: overnight$/,
    },
    {
      label: "is scheduled without a delivery date",
      shipping: { method: "scheduled", cost: money("5,00") },
      error: RangeError,
      message: /^delivery date must be a valid YYYY-MM-DD date: undefined$/,
    },
    {
      label: "is scheduled for an impossible date",
      shipping: { method: "scheduled", cost: money("5,00"), deliveryDate: "2026-02-30" },
      error: RangeError,
      message: /^delivery date must be a valid YYYY-MM-DD date: 2026-02-30$/,
    },
    {
      label: "is scheduled for a malformed date",
      shipping: { method: "scheduled", cost: money("5,00"), deliveryDate: "10/10/2026" },
      error: RangeError,
      message: /^delivery date must be a valid YYYY-MM-DD date: 10\/10\/2026$/,
    },
    {
      label: "is standard with a malformed delivery date",
      shipping: { method: "standard", cost: money("5,00"), deliveryDate: "2026-13-01" },
      error: RangeError,
      message: /^delivery date must be a valid YYYY-MM-DD date: 2026-13-01$/,
    },
  ])("throws when shipping $label", ({ shipping, error, message }) => {
    const orders = [
      {
        id: "o1",
        lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }],
        shipping,
      } as unknown as Order,
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("10,00") })).toThrow(error);
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: money("10,00") })).toThrow(message);
  });
});

import { it as fixtureItacceptanceScopegiftcardcheckout, expect as fixtureExpectacceptanceScopegiftcardcheckout } from "vitest";
import { acceptanceScopegiftcardcheckout } from "../src/report.js";
fixtureItacceptanceScopegiftcardcheckout("scoped deterministic execution fixture", () => fixtureExpectacceptanceScopegiftcardcheckout(acceptanceScopegiftcardcheckout).toBe("gift-card-checkout"));
