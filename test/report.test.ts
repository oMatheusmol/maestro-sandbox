import { describe, expect, it } from "vitest";
import { reconcile } from "../src/report.js";

describe("reconcile", () => {
  it("accepts a matching settlement", () => {
    const orders = [{ id: "o1", lines: [{ sku: "A", unitPrice: "10,00", quantity: 1 }] }];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: 10 })).not.toThrow();
  });

  it("tolerates floating-point precision issues", () => {
    const orders = [
      {
        id: "o1",
        lines: [
          { sku: "A", unitPrice: "0,10", quantity: 1 },
          { sku: "B", unitPrice: "0,20", quantity: 1 },
        ],
      },
    ];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: 0.3 })).not.toThrow();
  });

  it("throws on significant mismatch", () => {
    const orders = [{ id: "o1", lines: [{ sku: "A", unitPrice: "10,00", quantity: 1 }] }];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: 10.5 })).toThrow(
      /reconciliation mismatch: expected 10, paid out 10.5/,
    );
  });
});
