import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("font loading integration", () => {
  it("loads Google Fonts from index.html instead of a CSS @import", () => {
    const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    const globalStyles = readFileSync(
      resolve(process.cwd(), "src/styles/globals.css"),
      "utf8",
    );

    expect(indexHtml).toContain("fonts.googleapis.com");
    expect(globalStyles).not.toContain("fonts.googleapis.com");
  });
});
