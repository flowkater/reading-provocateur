import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveBook, getBooks } from "../../src/lib/store";
import type { Book } from "../../src/types";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

const book: Book = {
  id: "b1",
  fileName: "test.pdf",
  totalPages: 100,
  currentPage: 1,
  addedAt: new Date().toISOString(),
};

describe("store — localStorage 쓰기 방어", () => {
  it("정상 쓰기 → 데이터 저장됨", () => {
    saveBook(book);
    expect(getBooks()).toHaveLength(1);
  });

  it("용량 초과 → console.warn 호출, 에러 안 던짐", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });

    expect(() => saveBook(book)).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[store] Failed to write"),
      expect.any(String)
    );
  });

  it("localStorage 차단 → console.warn 호출, 에러 안 던짐", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("SecurityError", "SecurityError");
    });

    expect(() => saveBook(book)).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });
});
