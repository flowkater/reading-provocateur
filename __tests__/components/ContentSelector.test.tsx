import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContentSelector } from "../../src/components/FileDropZone";
import type { Article } from "../../src/types";

afterEach(cleanup);

const mockArticle: Article = {
  id: "article-1",
  url: "https://example.com/post",
  title: "Test Article",
  content: "Article content",
  htmlContent: "<p>Article content</p>",
  charCount: 15,
  addedAt: "2026-03-09T00:00:00.000Z",
};

function renderSelector(overrides = {}) {
  const props = {
    onFileSelect: vi.fn(),
    onArticleLoad: vi.fn(),
    onSampleClick: vi.fn(),
    parseArticleFn: vi.fn().mockResolvedValue(mockArticle),
    ...overrides,
  };
  const result = render(<ContentSelector {...props} />);
  return { ...result, props };
}

describe("ContentSelector", () => {
  it("탭 전환: PDF ↔ 웹 아티클", async () => {
    renderSelector();

    // Default: PDF tab active
    expect(screen.getByText("PDF를 여기에 드롭")).toBeInTheDocument();

    // Switch to article tab
    await userEvent.click(screen.getByText("웹 아티클"));
    expect(screen.getByText("웹 아티클 URL 입력")).toBeInTheDocument();
    expect(screen.queryByText("PDF를 여기에 드롭")).not.toBeInTheDocument();

    // Switch back to PDF tab
    await userEvent.click(screen.getByText("PDF 파일"));
    expect(screen.getByText("PDF를 여기에 드롭")).toBeInTheDocument();
  });

  it("URL 입력 + 불러오기 → onArticleLoad 호출", async () => {
    const { props } = renderSelector();

    await userEvent.click(screen.getByText("웹 아티클"));
    await userEvent.type(
      screen.getByPlaceholderText("https://..."),
      "https://example.com/post"
    );
    await userEvent.click(screen.getByText("불러오기"));

    await waitFor(() => {
      expect(props.onArticleLoad).toHaveBeenCalledWith(mockArticle);
    });
  });

  it("로딩 중 버튼 disabled", async () => {
    let resolveArticle!: (a: Article) => void;
    const parseArticleFn = vi.fn(
      () => new Promise<Article>((resolve) => { resolveArticle = resolve; })
    );
    renderSelector({ parseArticleFn });

    await userEvent.click(screen.getByText("웹 아티클"));
    await userEvent.type(
      screen.getByPlaceholderText("https://..."),
      "https://example.com/post"
    );
    await userEvent.click(screen.getByText("불러오기"));

    expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
    expect(screen.getByText("불러오는 중...").closest("button")).toBeDisabled();

    // Resolve to clean up
    resolveArticle(mockArticle);
    await waitFor(() => {
      expect(screen.getByText("불러오기")).toBeInTheDocument();
    });
  });

  it("에러 표시", async () => {
    const parseArticleFn = vi
      .fn()
      .mockRejectedValue(new Error("파싱 실패"));
    renderSelector({ parseArticleFn });

    await userEvent.click(screen.getByText("웹 아티클"));
    await userEvent.type(
      screen.getByPlaceholderText("https://..."),
      "https://example.com/bad"
    );
    await userEvent.click(screen.getByText("불러오기"));

    await waitFor(() => {
      expect(screen.getByText("파싱 실패")).toBeInTheDocument();
    });
  });

  it("Enter 키 submit → onArticleLoad", async () => {
    const { props } = renderSelector();

    await userEvent.click(screen.getByText("웹 아티클"));
    const input = screen.getByPlaceholderText("https://...");
    await userEvent.type(input, "https://example.com/post{enter}");

    await waitFor(() => {
      expect(props.onArticleLoad).toHaveBeenCalledWith(mockArticle);
    });
  });

  it("잘못된 URL → 버튼 disabled", async () => {
    renderSelector();

    await userEvent.click(screen.getByText("웹 아티클"));

    // Empty URL
    const button = screen.getByText("불러오기");
    expect(button).toBeDisabled();

    // ftp:// protocol
    await userEvent.type(
      screen.getByPlaceholderText("https://..."),
      "ftp://files.example.com"
    );
    expect(button).toBeDisabled();
  });
});
