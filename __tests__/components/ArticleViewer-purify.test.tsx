import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ArticleViewer } from "../../src/components/ArticleViewer";
import type { Article } from "../../src/types";

afterEach(cleanup);

describe("DOMPurify integration", () => {
  it("script 태그 제거 확인 (실제 DOMPurify)", () => {
    const article: Article = {
      id: "xss-test",
      url: "https://example.com/xss",
      title: "XSS Test",
      content: "safe content",
      htmlContent: '<p>safe</p><script>alert("xss")</script>',
      charCount: 12,
      addedAt: "2026-03-09T00:00:00.000Z",
    };

    const { container } = render(
      <ArticleViewer article={article} onTextSelect={vi.fn()} />
    );

    const articleEl = container.querySelector("article");
    expect(articleEl?.innerHTML).toContain("safe");
    expect(articleEl?.innerHTML).not.toContain("<script");
    expect(articleEl?.innerHTML).not.toContain("alert");
  });
});
