import { defineConfig } from "vitest/config";

// Unit tests only: the UI tests in e2e/ run with Playwright (`pnpm test:ui`).
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});
