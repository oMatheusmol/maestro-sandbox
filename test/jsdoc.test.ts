import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("JSDoc documentation", () => {
  const files = [
    "src/cart.ts",
    "src/money.ts",
    "src/paginate.ts",
    "src/report.ts",
    "src/upstream.ts",
    "src/user.ts",
  ];

  files.forEach((file) => {
    it(`${file} exports have JSDoc`, () => {
      const content = fs.readFileSync(path.join(process.cwd(), file), "utf-8");

      // Find all exported items (function, class, interface)
      const exportPattern = /export\s+(function|class|interface|async\s+function)\s+(\w+)/g;
      const matches = [...content.matchAll(exportPattern)];

      expect(matches.length).toBeGreaterThan(0);

      matches.forEach((match) => {
        const itemType = match[1] ?? "";
        const itemName = match[2] ?? "";
        const matchIndex = match.index ?? 0;

        // Find the last JSDoc comment before this export
        const beforeExport = content.substring(0, matchIndex);
        const jsdocRegex = /\/\*\*\s*\n?\s*(.+?)\s*\*\//gs;
        const allMatches = [...beforeExport.matchAll(jsdocRegex)];
        const jsdocMatch = allMatches.length > 0 ? allMatches[allMatches.length - 1] : null;

        expect(jsdocMatch, `${file}: ${itemType} ${itemName} should have JSDoc`).toBeTruthy();

        // Ensure JSDoc is a single line (no newlines within the comment)
        if (jsdocMatch && jsdocMatch[1]) {
          const jsdocContent = jsdocMatch[1].trim();
          // Should not have multiple asterisks on separate lines (which indicates multi-line JSDoc)
          const hasMultipleLines = jsdocContent.includes("\n *");
          expect(hasMultipleLines, `${file}: ${itemName} JSDoc should be one-line`).toBe(false);
        }
      });
    });
  });
});
