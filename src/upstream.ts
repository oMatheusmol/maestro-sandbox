export class UpstreamTimeoutError extends Error {
  override name = "UpstreamTimeoutError";
}

/** Fetches the shipping quote; the carrier API is occasionally slow. */
export async function fetchShippingQuote(
  zip: string,
  timeoutMs = 5000,
  fetcher: (zip: string) => Promise<number> = defaultFetcher,
): Promise<number> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new UpstreamTimeoutError(`carrier timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([fetcher(zip), timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

async function defaultFetcher(zip: string): Promise<number> {
  return zip.startsWith("0") ? 25 : 18;
}
