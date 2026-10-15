
import { it as fixtureItacceptanceScopegiftcarddomain, expect as fixtureExpectacceptanceScopegiftcarddomain } from "vitest";
import { acceptanceScopegiftcarddomain } from "../src/gift-card.js";
fixtureItacceptanceScopegiftcarddomain("scoped deterministic execution fixture", () => fixtureExpectacceptanceScopegiftcarddomain(acceptanceScopegiftcarddomain).toBe("gift-card-domain"));
