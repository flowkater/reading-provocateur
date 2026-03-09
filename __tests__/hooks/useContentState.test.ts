import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useContentState } from "../../src/hooks/useContentState";
import type { Article } from "../../src/types";

// Polyfill for jsdom
const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
const revokeObjectURLMock = vi.fn();

beforeEach(() => {
  URL.createObjectURL = createObjectURLMock;
  URL.revokeObjectURL = revokeObjectURLMock;
  createObjectURLMock.mockClear();
  revokeObjectURLMock.mockClear();
});

const mockArticle: Article = {
  id: "article-1",
  url: "https://example.com/post",
  title: "Test Article",
  content: "Article content for testing purposes",
  htmlContent: "<p>Article content for testing purposes</p>",
  charCount: 36,
  addedAt: "2026-03-09T00:00:00.000Z",
};

describe("useContentState — PDF (기존)", () => {
  it("fileUrl 변경 시 이전 URL에 revokeObjectURL 호출", () => {
    createObjectURLMock
      .mockReturnValueOnce("blob:first-url")
      .mockReturnValueOnce("blob:second-url");

    const { result } = renderHook(() => useContentState());

    // First file
    act(() => {
      result.current.handleFileSelect(
        new File(["a"], "a.pdf", { type: "application/pdf" })
      );
    });
    expect(result.current.contentSource?.type).toBe("pdf");
    if (result.current.contentSource?.type === "pdf") {
      expect(result.current.contentSource.fileUrl).toBe("blob:first-url");
    }
    expect(revokeObjectURLMock).not.toHaveBeenCalled();

    // Second file — should revoke first URL
    act(() => {
      result.current.handleFileSelect(
        new File(["b"], "b.pdf", { type: "application/pdf" })
      );
    });
    if (result.current.contentSource?.type === "pdf") {
      expect(result.current.contentSource.fileUrl).toBe("blob:second-url");
    }
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:first-url");
  });

  it("unmount 시 현재 fileUrl에 revokeObjectURL 호출", () => {
    createObjectURLMock.mockReturnValue("blob:cleanup-url");

    const { result, unmount } = renderHook(() => useContentState());

    act(() => {
      result.current.handleFileSelect(
        new File(["c"], "c.pdf", { type: "application/pdf" })
      );
    });

    unmount();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:cleanup-url");
  });
});

describe("useContentState — Article", () => {
  it("handleArticleLoad → contentSource.type 'article' + pageText 설정", () => {
    const { result } = renderHook(() => useContentState());

    act(() => {
      result.current.handleArticleLoad(mockArticle);
    });

    expect(result.current.contentSource?.type).toBe("article");
    if (result.current.contentSource?.type === "article") {
      expect(result.current.contentSource.article).toBe(mockArticle);
    }
    expect(result.current.pageText).toBe(mockArticle.content);
  });

  it("handleTextSelect + clearSelection", () => {
    const { result } = renderHook(() => useContentState());

    act(() => {
      result.current.handleTextSelect("selected", { x: 10, y: 20 });
    });
    expect(result.current.selectedText).toBe("selected");
    expect(result.current.selectionPosition).toEqual({ x: 10, y: 20 });

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedText).toBeNull();
    expect(result.current.selectionPosition).toBeNull();
  });

  it("clear → 모든 상태 초기화", () => {
    const { result } = renderHook(() => useContentState());

    act(() => {
      result.current.handleArticleLoad(mockArticle);
      result.current.handleTextSelect("text", { x: 1, y: 2 });
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.contentSource).toBeNull();
    expect(result.current.pageText).toBe("");
    expect(result.current.selectedText).toBeNull();
  });
});
