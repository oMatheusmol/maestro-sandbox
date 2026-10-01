export class UpstreamTimeoutError extends Error {
  override name = "UpstreamTimeoutError";
}

/** Fetches the shipping quote; the carrier API is occasionally slow. */
export async function fetchShippingQuote(
  zip: string,
  timeoutMs = 5000,
  fetcher: (zip: string) => Promise<number> = defaultFetcher,
): Promise<number> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new UpstreamTimeoutError(`carrier timed out after ${timeoutMs}ms`)), timeoutMs),
  );
  return Promise.race([fetcher(zip), timeout]);
}

async function defaultFetcher(zip: string): Promise<number> {
  return zip.startsWith("0") ? 25 : 18;
}
