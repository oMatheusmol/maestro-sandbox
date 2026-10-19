/** Characters of an order number: Crockford base32, which leaves out I, L, O and U so a number read aloud is not misheard. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** How many characters an order number has, and so how many random bytes make one. */
export const ORDER_NUMBER_LENGTH = 8;

/** The shape of a valid order number. */
export const ORDER_NUMBER_PATTERN = /^[0-9A-HJKMNP-TV-Z]{8}$/;

/**
 * Builds an order number from random bytes: each byte's low five bits pick one of the 32
 * characters, so every character is equally likely.
 * @throws {RangeError} When there are not exactly ORDER_NUMBER_LENGTH bytes.
 */
export function orderNumberFrom(bytes: Uint8Array): string {
  if (bytes.length !== ORDER_NUMBER_LENGTH) {
    throw new RangeError(`an order number takes ${ORDER_NUMBER_LENGTH} random bytes: ${bytes.length}`);
  }
  return [...bytes].map((byte) => ALPHABET.charAt(byte & 31)).join("");
}
