import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Article } from "../../src/types";

// Mock PdfViewer
const MockPdfViewer = (props: any) => (
  <div data-testid="pdf-viewer" data-page={props.currentPage}>
    <button
      data-testid="simulate-text-select"
      onClick={() => props.onTextSelect("selected text", { x: 100, y: 200 })}
    >
      Select Text
    </button>
  </div>
);

vi.mock("../../src/components/PdfViewer", () => ({
  PdfViewer: MockPdfViewer,
  default: MockPdfViewer,
}));

// Mock ArticleViewer to expose text selection
vi.mock("../../src/components/ArticleViewer", () => ({
  ArticleViewer: (props: any) => (
    <div data-testid="article-viewer">
      <h1>{props.article.title}</h1>
      <p>{props.article.content}</p>
      <button
        data-testid="simulate-article-text-select"
        onClick={() =>
          props.onTextSelect("article selected text", { x: 150, y: 250 })
        }
      >
        Select Article Text
      </button>
    </div>
  ),
}));

vi.mock("../../src/components/SidePanel", () => ({
  SidePanel: (props: any) => (
    <div data-testid="side-panel" data-state={props.state}>
      <button
        data-testid="open-settings-from-panel"
        onClick={props.onOpenSettings}
      >
        Settings
      </button>
    </div>
  ),
}));

vi.mock("../../src/components/FloatingToolbar", () => ({
  FloatingToolbar: (props: any) => (
    <div data-testid="floating-toolbar">
      <button
        data-testid="provoke-core"
        onClick={() => props.onProvoke("core")}
      >
        Provoke Core
      </button>
    </div>
  ),
}));

vi.mock("../../src/components/SettingsDialog", () => ({
  SettingsDialog: () => <div data-testid="settings-dialog" />,
}));

vi.mock("../../src/lib/anthropic-provider", () => ({
  AnthropicProvider: vi.fn(),
}));

vi.mock("react-pdf", () => ({
  Document: ({ children }: any) => <div>{children}</div>,
  Page: () => <div />,
  pdfjs: { GlobalWorkerOptions: { workerSrc: "" } },
}));

vi.mock("pdfjs-dist", () => ({
  getDocument: vi.fn(),
}));

const mockArticle: Article = {
  id: "article-1",
  url: "https://example.com/post",
  title: "Integration Test Article",
  content: "This is article content for integration testing.",
  htmlContent: "<p>This is article content for integration testing.</p>",
  charCount: 48,
  addedAt: "2026-03-09T00:00:00.000Z",
};

// Mock article-parser with the mock article
vi.mock("../../src/lib/article-parser", () => ({
  parseArticle: vi.fn().mockResolvedValue({
    id: "article-1",
    url: "https://example.com/post",
    title: "Integration Test Article",
    content: "This is article content for integration testing.",
    htmlContent: "<p>This is article content for integration testing.</p>",
    charCount: 48,
    addedAt: "2026-03-09T00:00:00.000Z",
  }),
}));

import { ReadingView } from "../../src/components/ReadingView";

// Polyfill URL.createObjectURL for jsdom
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
  URL.revokeObjectURL = vi.fn();
}

afterEach(cleanup);

describe("ReadingView — Article Integration", () => {
  it("PDF contentSource → PdfViewer 렌더링", async () => {
    render(<ReadingView mode="understand" />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["pdf"], "test.pdf", { type: "application/pdf" });
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
    });
  });

  it("article contentSource → ArticleViewer 렌더링", async () => {
    render(<ReadingView mode="understand" />);

    // Switch to article tab
    await userEvent.click(screen.getByText("웹 아티클"));

    // Type URL and submit
    await userEvent.type(
      screen.getByPlaceholderText("https://..."),
      "https://example.com/post"
    );
    await userEvent.click(screen.getByText("불러오기"));

    await waitFor(() => {
      expect(screen.getByTestId("article-viewer")).toBeInTheDocument();
    });
  });

  it("null contentSource → ContentSelector 렌더링", () => {
    render(<ReadingView mode="understand" />);
    expect(screen.getByText("PDF 파일")).toBeInTheDocument();
    expect(screen.getByText("웹 아티클")).toBeInTheDocument();
  });

  it("아티클 모드에서 BottomBar 숨김", async () => {
    render(<ReadingView mode="understand" />);

    await userEvent.click(screen.getByText("웹 아티클"));
    await userEvent.type(
      screen.getByPlaceholderText("https://..."),
      "https://example.com/post"
    );
    await userEvent.click(screen.getByText("불러오기"));

    await waitFor(() => {
      expect(screen.getByTestId("article-viewer")).toBeInTheDocument();
    });

    // BottomBar should not be rendered for articles
    expect(screen.queryByText(/p\.\d+\/\d+/)).not.toBeInTheDocument();
  });

  it("아티클 텍스트 선택 → FloatingToolbar 표시", async () => {
    render(<ReadingView mode="understand" />);

    await userEvent.click(screen.getByText("웹 아티클"));
    await userEvent.type(
      screen.getByPlaceholderText("https://..."),
      "https://example.com/post"
    );
    await userEvent.click(screen.getByText("불러오기"));

    await waitFor(() => {
      expect(
        screen.getByTestId("simulate-article-text-select")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("simulate-article-text-select"));
    expect(screen.getByTestId("floating-toolbar")).toBeInTheDocument();
  });

  it("아티클 도발 생성 (provoke 후 toolbar 사라짐)", async () => {
    render(<ReadingView mode="understand" />);

    await userEvent.click(screen.getByText("웹 아티클"));
    await userEvent.type(
      screen.getByPlaceholderText("https://..."),
      "https://example.com/post"
    );
    await userEvent.click(screen.getByText("불러오기"));

    await waitFor(() => {
      expect(
        screen.getByTestId("simulate-article-text-select")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("simulate-article-text-select"));
    fireEvent.click(screen.getByTestId("provoke-core"));

    // After provoke, toolbar should be gone
    expect(screen.queryByTestId("floating-toolbar")).not.toBeInTheDocument();
  });
});
