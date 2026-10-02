import { describe, expect, it, vi } from "vitest";
import { fetchShippingQuote, UpstreamTimeoutError } from "../src/upstream.js";

describe("fetchShippingQuote", () => {
  it("returns the carrier quote", async () => {
    await expect(fetchShippingQuote("01000-000", 100)).resolves.toBe(25);
  });

  it("rejects with UpstreamTimeoutError when carrier is slow", async () => {
    vi.useFakeTimers();
    try {
      const slowFetcher = (): Promise<number> => new Promise(() => {
        // Never resolves
      });

      const promise = fetchShippingQuote("01000-000", 100, slowFetcher);
      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toThrow(UpstreamTimeoutError);
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the timeout when the carrier responds first", async () => {
    vi.useFakeTimers();
    try {
      await fetchShippingQuote("01000-000", 100);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the timeout when the carrier times out", async () => {
    vi.useFakeTimers();
    try {
      const slowFetcher = (): Promise<number> => new Promise(() => {
        // Never resolves
      });

      const promise = fetchShippingQuote("01000-000", 100, slowFetcher);
      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toThrow(UpstreamTimeoutError);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
