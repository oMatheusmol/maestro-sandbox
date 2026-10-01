import { describe, expect, it } from "vitest";
import { reconcile } from "../src/report.js";

describe("reconcile", () => {
  it("accepts a matching settlement", () => {
    const orders = [{ id: "o1", lines: [{ sku: "A", unitPrice: "10,00", quantity: 1 }] }];
    expect(() => reconcile(orders, { orderIds: ["o1"], paidOut: 10 })).not.toThrow();
  });
});
