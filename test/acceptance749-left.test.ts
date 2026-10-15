import { describe, expect, it } from "vitest";
import { routingMarker } from "../src/acceptance749-left.js";
describe("routingMarker left", () => {
  it("trims surrounding spaces", () => expect(routingMarker("  value  ")).toBe("value"));
  it("keeps an empty value empty", () => expect(routingMarker("")).toBe(""));
});
