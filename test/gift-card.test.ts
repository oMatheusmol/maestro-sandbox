
import { it as fixtureItacceptanceScopegiftcards, expect as fixtureExpectacceptanceScopegiftcards } from "vitest";
import { acceptanceScopegiftcards } from "../src/gift-card.js";
fixtureItacceptanceScopegiftcards("scoped deterministic execution fixture", () => fixtureExpectacceptanceScopegiftcards(acceptanceScopegiftcards).toBe("gift-cards"));
