import { describe, expect, it } from "vitest";
import { fetchShippingQuote } from "../src/upstream.js";

describe("fetchShippingQuote", () => {
  it("returns the carrier quote", async () => {
    await expect(fetchShippingQuote("01000-000", 100)).resolves.toBe(25);
  });
});
