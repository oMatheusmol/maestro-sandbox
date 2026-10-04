import { describe, expect, it, vi } from "vitest";
import { fetchShippingQuote, UpstreamTimeoutError } from "../src/upstream.js";

describe("fetchShippingQuote", () => {
  it("returns the carrier quote", async () => {
    await expect(fetchShippingQuote("01000-000", 100)).resolves.toBe(25);
  });

  it("throws when zip is not a string", async () => {
    await expect(fetchShippingQuote(123 as any)).rejects.toThrow(TypeError);
    await expect(fetchShippingQuote(123 as any)).rejects.toThrow(/zip must be a string/);
  });

  it("throws when timeoutMs is not a positive integer", async () => {
    await expect(fetchShippingQuote("01000-000", -1)).rejects.toThrow(RangeError);
    await expect(fetchShippingQuote("01000-000", -1)).rejects.toThrow(
      /timeoutMs must be a positive integer/,
    );
  });

  it("throws when timeoutMs is zero", async () => {
    await expect(fetchShippingQuote("01000-000", 0)).rejects.toThrow(RangeError);
    await expect(fetchShippingQuote("01000-000", 0)).rejects.toThrow(
      /timeoutMs must be a positive integer/,
    );
  });

  it("throws when timeoutMs is a non-integer", async () => {
    await expect(fetchShippingQuote("01000-000", 1.5)).rejects.toThrow(RangeError);
    await expect(fetchShippingQuote("01000-000", 1.5)).rejects.toThrow(
      /timeoutMs must be a positive integer/,
    );
  });

  it("clears the timeout when carrier responds first", async () => {
    vi.useFakeTimers();
    try {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const promise = fetchShippingQuote("01000-000", 1000);
      expect(clearTimeoutSpy).not.toHaveBeenCalled();
      await promise;
      expect(clearTimeoutSpy).toHaveBeenCalled();
    } finally {
      vi.restoreAllMocks();
      vi.useRealTimers();
    }
  });

  it("clears the timeout when carrier times out", async () => {
    vi.useFakeTimers();
    try {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const promise = fetchShippingQuote("01000-000", 50, () => new Promise(() => {}));
      vi.advanceTimersByTime(100);
      await expect(promise).rejects.toThrow(UpstreamTimeoutError);
      expect(clearTimeoutSpy).toHaveBeenCalled();
    } finally {
      vi.restoreAllMocks();
      vi.useRealTimers();
    }
  });
});
