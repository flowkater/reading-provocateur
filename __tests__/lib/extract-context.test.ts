import { describe, it, expect } from "vitest";
import { extractContext } from "../../src/lib/extract-context";

describe("extractContext", () => {
  const longPage = "A".repeat(800) + "SELECTED_TEXT" + "B".repeat(800);

  it("선택 텍스트가 페이지 중간 → ±800자 추출", () => {
    const result = extractContext(longPage, "SELECTED_TEXT");
    expect(result).toContain("SELECTED_TEXT");
    expect(result.length).toBeLessThanOrEqual(800 + "SELECTED_TEXT".length + 800);
  });

  it("선택 텍스트가 페이지 시작 → 앞 0, 뒤 800자", () => {
    const page = "START_TEXT" + "C".repeat(2000);
    const result = extractContext(page, "START_TEXT");
    expect(result.startsWith("START_TEXT")).toBe(true);
    expect(result.length).toBeLessThanOrEqual("START_TEXT".length + 800);
  });

  it("선택 텍스트가 페이지 끝 → 앞 800자, 뒤 0", () => {
    const page = "D".repeat(2000) + "END_TEXT";
    const result = extractContext(page, "END_TEXT");
    expect(result.endsWith("END_TEXT")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(800 + "END_TEXT".length);
  });

  it("선택 텍스트를 페이지에서 못 찾으면 첫 1500자 fallback", () => {
    const page = "E".repeat(3000);
    const result = extractContext(page, "NOT_FOUND");
    expect(result.length).toBe(1500);
  });

  it("페이지 텍스트 1500자 미만 → 전체 반환", () => {
    const page = "short text";
    const result = extractContext(page, "NOT_FOUND");
    expect(result).toBe("short text");
  });

  it("선택 텍스트 null → 첫 1500자 반환 (페이지 기반 도발)", () => {
    const page = "F".repeat(3000);
    const result = extractContext(page, null);
    expect(result.length).toBe(1500);
  });
});
