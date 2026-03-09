import { describe, it, expect, vi, beforeEach } from "vitest";
import { Readability } from "@mozilla/readability";

// Mock @mozilla/readability
const mockParse = vi.fn();
vi.mock("@mozilla/readability", () => ({
  Readability: vi.fn().mockImplementation(() => ({
    parse: mockParse,
  })),
}));

import { parseArticle } from "../../src/lib/article-parser";

const VALID_HTML =
  "<html><head><title>Test Title</title></head><body><p>Test content body</p></body></html>";

beforeEach(() => {
  mockParse.mockReset();
  vi.mocked(Readability).mockClear();
});

describe("parseArticle", () => {
  it("유효한 HTML → title + content + charCount 추출", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(VALID_HTML, { status: 200 })
    );
    mockParse.mockReturnValue({
      title: "Parsed Title",
      textContent: "Parsed text content",
      content: "<p>Parsed text content</p>",
    });

    const article = await parseArticle("https://example.com/article");
    expect(article.title).toBe("Parsed Title");
    expect(article.content).toBe("Parsed text content");
    expect(article.charCount).toBe("Parsed text content".length);
    expect(article.htmlContent).toBe("<p>Parsed text content</p>");
    expect(article.url).toBe("https://example.com/article");
    expect(article.id).toBeDefined();
  });

  it("Readability parse() null → 에러 throw", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(VALID_HTML, { status: 200 })
    );
    mockParse.mockReturnValue(null);

    await expect(parseArticle("https://example.com/bad")).rejects.toThrow(
      "아티클로 인식되지 않습니다"
    );
  });

  it("빈 textContent → 에러 throw", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(VALID_HTML, { status: 200 })
    );
    mockParse.mockReturnValue({
      title: "Title",
      textContent: "   ",
      content: "<p></p>",
    });

    await expect(parseArticle("https://example.com/empty")).rejects.toThrow(
      "아티클로 인식되지 않습니다"
    );
  });

  it("URL fetch 실패 → 에러 메시지", async () => {
    vi.spyOn(global, "fetch")
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response("", { status: 502 }));

    await expect(parseArticle("https://example.com/fail")).rejects.toThrow(
      "아티클을 불러올 수 없습니다"
    );
  });

  it("charCount === content.length", async () => {
    const textContent = "한국어 테스트 콘텐츠입니다";
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(VALID_HTML, { status: 200 })
    );
    mockParse.mockReturnValue({
      title: "Title",
      textContent,
      content: `<p>${textContent}</p>`,
    });

    const article = await parseArticle("https://example.com/kr");
    expect(article.charCount).toBe(textContent.length);
  });

  it("직접 fetch 성공 → 프록시 미호출 (fetch 1회만 호출)", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(VALID_HTML, { status: 200 })
    );
    mockParse.mockReturnValue({
      title: "Title",
      textContent: "content",
      content: "<p>content</p>",
    });

    await parseArticle("https://example.com/direct");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith("https://example.com/direct");
  });

  it("직접 fetch CORS 실패 → 프록시 fallback 성공", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(VALID_HTML, { status: 200 }));
    mockParse.mockReturnValue({
      title: "Title",
      textContent: "proxy content",
      content: "<p>proxy content</p>",
    });

    const article = await parseArticle("https://example.com/cors");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1][0]).toContain("/cors-proxy");
    expect(article.content).toBe("proxy content");
  });

  it("직접 + 프록시 모두 실패 → 에러", async () => {
    vi.spyOn(global, "fetch")
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response("", { status: 500 }));

    await expect(parseArticle("https://example.com/allfail")).rejects.toThrow(
      "아티클을 불러올 수 없습니다"
    );
  });
});
