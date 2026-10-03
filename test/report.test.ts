import { describe, expect, it } from "vitest";
import { reconcile } from "../src/report.js";

describe("reconcile", () => {
  it("accepts a matching settlement", () => {
    const orders = [{ id: "o1", lines: [{ productCode: "A", unitPrice: "10,00", quantity: 1 }] }];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: 10 })).not.toThrow();
  });

  it("tolerates floating-point precision issues", () => {
    const orders = [
      {
        id: "o1",
        lines: [
          { productCode: "A", unitPrice: "0,10", quantity: 1 },
          { productCode: "B", unitPrice: "0,20", quantity: 1 },
        ],
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: 0.3 })).not.toThrow();
  });

  it("throws on significant mismatch", () => {
    const orders = [{ id: "o1", lines: [{ productCode: "A", unitPrice: "10,00", quantity: 1 }] }];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: 10.5 })).toThrow(
      /reconciliation mismatch: expected 10, paid out 10.5/,
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
