import { describe, expect, it } from "vitest";
import { Money } from "../src/money.js";
import { reconcile } from "../src/report.js";

describe("reconcile", () => {
  const money = (value: string) => Money.fromBRL(value);

  it("accepts a matching settlement", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: 10 })).not.toThrow();
  });

  it("tolerates floating-point precision issues", () => {
    const orders = [
      {
        id: "o1",
        lines: [
          { productCode: "A", unitPrice: money("0,10"), quantity: 1 },
          { productCode: "B", unitPrice: money("0,20"), quantity: 1 },
        ],
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: 0.3 })).not.toThrow();
  });

  it("throws on significant mismatch", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: 10.5 })).toThrow(
      /reconciliation mismatch: expected 10, paid out 10.5/,
    );
  });

  it("throws naming a settlement id that matches no order", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
    ];
    const settlement = { orderIds: ["o1", "o-9"], paidOut: 10 };
    expect(() => reconcile(orders, settlement)).toThrow(Error);
    expect(() => reconcile(orders, settlement)).toThrow(/^settlement names unknown orders: o-9$/);
  });

  it("names every unknown id in settlement order, before comparing amounts", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
    ];
    const settlement = { orderIds: ["o-9", "o1", "o-12"], paidOut: 99 };
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
    const settlement = { orderIds: ["o-3", "o1", "o-3"], paidOut: 15 };
    expect(() => reconcile(orders, settlement)).toThrow(Error);
    expect(() => reconcile(orders, settlement)).toThrow(/^settlement names an order twice: o-3$/);
  });

  it("lists an unknown id the settlement repeats only once", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
    ];
    const settlement = { orderIds: ["o-9", "o1", "o-9"], paidOut: 10 };
    expect(() => reconcile(orders, settlement)).toThrow(Error);
    expect(() => reconcile(orders, settlement)).toThrow(/^settlement names unknown orders: o-9$/);
  });

  it("lists several repeated ids in the order the repeats happen", () => {
    const orders = [
      { id: "o1", lines: [{ productCode: "A", unitPrice: money("10,00"), quantity: 1 }] },
      { id: "o2", lines: [{ productCode: "B", unitPrice: money("5,00"), quantity: 1 }] },
    ];
    const settlement = { orderIds: ["o2", "o1", "o1", "o2"], paidOut: 15 };
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
    expect(() => reconcile(orders, { orderIds, paidOut: 21.5 })).not.toThrow();
    expect(() => reconcile(orders, { orderIds, paidOut: 20 })).toThrow(
      /^reconciliation mismatch: expected 21.5, paid out 20$/,
    );
  });

  it("throws when orders is not an array", () => {
    expect(() => reconcile(null as any, { orderIds: [], paidOut: 0 })).toThrow(TypeError);
    expect(() => reconcile(null as any, { orderIds: [], paidOut: 0 })).toThrow(
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
    expect(() => reconcile(orders, { orderIds: null, paidOut: 0 } as any)).toThrow(TypeError);
    expect(() => reconcile(orders, { orderIds: null, paidOut: 0 } as any)).toThrow(
      /settlement.orderIds must be an array/,
    );
  });

  it("throws when settlement.paidOut is not a finite number", () => {
    const orders: any[] = [];
    expect(() => reconcile(orders, { orderIds: [], paidOut: NaN })).toThrow(TypeError);
    expect(() => reconcile(orders, { orderIds: [], paidOut: NaN })).toThrow(
      /settlement.paidOut must be a finite number/,
    );
  });
});
