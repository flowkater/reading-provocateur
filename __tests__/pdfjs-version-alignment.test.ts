import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function normalizeVersionRange(version: string): string {
  return version.trim().replace(/^[~^]/, "");
}

describe("pdfjs dependency alignment", () => {
  it("keeps the app pdfjs-dist version aligned with react-pdf's expected version", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as {
      dependencies: Record<string, string>;
    };

    const reactPdfPackage = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "node_modules/react-pdf/package.json"),
        "utf8",
      ),
    ) as {
      dependencies: Record<string, string>;
    };

    expect(normalizeVersionRange(packageJson.dependencies["pdfjs-dist"])).toBe(
      normalizeVersionRange(reactPdfPackage.dependencies["pdfjs-dist"]),
    );
  });
});
