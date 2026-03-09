import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

// Mock DOMPurify
const mockSanitize = vi.fn((html: string) => html);
vi.mock("dompurify", () => ({
  default: {
    sanitize: (...args: unknown[]) => mockSanitize(...args),
  },
}));

import { ArticleViewer, PURIFY_CONFIG } from "../../src/components/ArticleViewer";
import { mockSelection } from "../../src/__test__/selection-mock";
import type { Annotation, Article } from "../../src/types";

afterEach(() => {
  cleanup();
  mockSanitize.mockClear();
});

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "test-id",
    url: "https://example.com/article",
    title: "Test Article Title",
    content: "Test article content text",
    htmlContent: "<p>Test article content text</p>",
    charCount: 25,
    addedAt: "2026-03-09T00:00:00.000Z",
    ...overrides,
  };
}

describe("ArticleViewer", () => {
  const articleAnnotation: Annotation = {
    id: "ann-1",
    bookId: "article-1",
    contentType: "article",
    pageNumber: 1,
    selectedText: "content text",
    quote: "content text",
    contextBefore: "article ",
    contextAfter: "",
    intent: null,
    createdAt: "2026-03-09T00:00:00.000Z",
  };

  it("아티클 제목 + 본문 렌더링", () => {
    const article = makeArticle();
    const { container } = render(
      <ArticleViewer article={article} onTextSelect={vi.fn()} />
    );

    expect(screen.getByText("Test Article Title")).toBeInTheDocument();
    const articleEl = container.querySelector("article");
    expect(articleEl).toBeInTheDocument();
    expect(articleEl?.innerHTML).toContain("Test article content text");
  });

  it("텍스트 선택 → onTextSelect 콜백", () => {
    const onTextSelect = vi.fn();
    const article = makeArticle();
    const { container } = render(
      <ArticleViewer article={article} onTextSelect={onTextSelect} />
    );

    mockSelection("selected phrase", { left: 150, bottom: 250 });
    fireEvent.mouseUp(container.firstChild!);

    expect(onTextSelect).toHaveBeenCalledWith(
      "selected phrase",
      {
        x: 150,
        y: 250,
      },
      expect.objectContaining({
        contentType: "article",
        quote: "selected phrase",
      })
    );
  });

  it("DOMPurify.sanitize 호출 + PURIFY_CONFIG 전달", () => {
    const article = makeArticle({
      htmlContent: "<p>sanitize me</p><script>bad</script>",
    });
    render(<ArticleViewer article={article} onTextSelect={vi.fn()} />);

    expect(mockSanitize).toHaveBeenCalledWith(
      "<p>sanitize me</p><script>bad</script>",
      PURIFY_CONFIG
    );
  });

  it("charCount + hostname 표시", () => {
    const article = makeArticle({
      charCount: 1234,
      url: "https://blog.example.com/post/123",
    });
    render(<ArticleViewer article={article} onTextSelect={vi.fn()} />);

    expect(screen.getByText(/1,234자/)).toBeInTheDocument();
    expect(screen.getByText("blog.example.com")).toBeInTheDocument();
  });

  it("빈 htmlContent → fallback 메시지", () => {
    const article = makeArticle({ htmlContent: "" });
    render(<ArticleViewer article={article} onTextSelect={vi.fn()} />);

    expect(
      screen.getByText("본문을 표시할 수 없습니다")
    ).toBeInTheDocument();
  });

  it("article annotation이 있으면 본문에 highlight mark를 복원", () => {
    const article = makeArticle({
      id: "article-1",
      htmlContent: "<p>Test article content text</p>",
    });
    const { container } = render(
      <ArticleViewer
        article={article}
        onTextSelect={vi.fn()}
        annotations={[articleAnnotation]}
      />
    );

    expect(container.querySelector("mark.highlight-yellow")).toBeInTheDocument();
  });
});
