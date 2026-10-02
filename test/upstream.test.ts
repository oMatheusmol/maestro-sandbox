import { describe, expect, it, vi } from "vitest";
import { fetchShippingQuote, UpstreamTimeoutError } from "../src/upstream.js";

describe("fetchShippingQuote", () => {
  it("returns the carrier quote", async () => {
    await expect(fetchShippingQuote("01000-000", 100)).resolves.toBe(25);
  });

  it("rejects with UpstreamTimeoutError when carrier is slow", async () => {
    const slowFetcher = (): Promise<number> => new Promise(() => {
      // Never resolves
    });

    await expect(
      fetchShippingQuote("01000-000", 100, slowFetcher),
    ).rejects.toThrow(UpstreamTimeoutError);
  });

  it("clears the timeout when the carrier responds first", async () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    await fetchShippingQuote("01000-000", 100);

    expect(clearTimeoutSpy).toHaveBeenCalledOnce();
    clearTimeoutSpy.mockRestore();
  });

  it("clears the timeout when the carrier times out", async () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const slowFetcher = (): Promise<number> => new Promise(() => {
      // Never resolves
    });

    await expect(
      fetchShippingQuote("01000-000", 100, slowFetcher),
    ).rejects.toThrow(UpstreamTimeoutError);

    expect(clearTimeoutSpy).toHaveBeenCalledOnce();
    clearTimeoutSpy.mockRestore();
  });
});
