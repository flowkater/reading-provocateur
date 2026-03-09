import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock heavy components — PdfViewer is lazy-loaded so needs both named + default export
const MockPdfViewer = (props: any) => (
  <div data-testid="pdf-viewer" data-page={props.currentPage}>
    <button
      data-testid="simulate-text-select"
      onClick={() => props.onTextSelect("selected text", { x: 100, y: 200 })}
    >
      Select Text
    </button>
    <button
      data-testid="simulate-page-text"
      onClick={() => props.onPageTextExtract("page text content")}
    >
      Extract Text
    </button>
  </div>
);

vi.mock("../../src/components/PdfViewer", () => ({
  PdfViewer: MockPdfViewer,
  default: MockPdfViewer,
}));

vi.mock("../../src/components/ArticleViewer", () => ({
  ArticleViewer: (props: any) => (
    <div data-testid="article-viewer">
      <h1>{props.article.title}</h1>
      <button
        data-testid="simulate-article-text-select"
        onClick={() => props.onTextSelect("article selected text", { x: 150, y: 250 })}
      >
        Select Article Text
      </button>
    </div>
  ),
}));

vi.mock("../../src/components/SidePanel", () => ({
  SidePanel: (props: any) => (
    <div data-testid="side-panel" data-state={props.state}>
      <button data-testid="open-settings-from-panel" onClick={props.onOpenSettings}>
        Settings
      </button>
    </div>
  ),
}));

vi.mock("../../src/components/FloatingToolbar", () => ({
  FloatingToolbar: (props: any) => (
    <div data-testid="floating-toolbar">
      <button data-testid="provoke-core" onClick={() => props.onProvoke("core")}>
        Provoke Core
      </button>
      <button data-testid="close-toolbar" onClick={props.onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("../../src/components/SettingsDialog", () => ({
  SettingsDialog: (props: any) => (
    <div data-testid="settings-dialog">
      <button data-testid="close-settings" onClick={props.onClose}>
        Close Settings
      </button>
    </div>
  ),
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

// Mock article-parser to avoid actual fetch in ContentSelector
vi.mock("../../src/lib/article-parser", () => ({
  parseArticle: vi.fn(),
}));

import { ReadingView } from "../../src/components/ReadingView";

// Polyfill URL.createObjectURL for jsdom
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
  URL.revokeObjectURL = vi.fn();
}

afterEach(cleanup);

describe("ReadingView", () => {
  it("NavBar/BottomBar 렌더링", () => {
    render(<ReadingView mode="understand" />);
    // NavBar has the mode badge
    expect(screen.getByText("이해")).toBeInTheDocument();
  });

  it("파일 없을 때 ContentSelector 표시", () => {
    render(<ReadingView mode="understand" />);
    expect(screen.getByText("PDF 파일")).toBeInTheDocument();
    expect(screen.getByText("웹 아티클")).toBeInTheDocument();
  });

  it("파일 드롭 → PdfViewer 렌더링", async () => {
    render(<ReadingView mode="understand" />);

    // Simulate file drop via the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
    });
  });

  it("텍스트 선택 → FloatingToolbar 표시", async () => {
    render(<ReadingView mode="understand" />);

    // First, load a file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByTestId("simulate-text-select")).toBeInTheDocument();
    });

    // Simulate text selection in PdfViewer
    fireEvent.click(screen.getByTestId("simulate-text-select"));

    expect(screen.getByTestId("floating-toolbar")).toBeInTheDocument();
  });

  it("FloatingToolbar에서 intent 선택 → flow.startProvocation 호출", async () => {
    render(<ReadingView mode="understand" />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByTestId("simulate-text-select")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("simulate-text-select"));
    fireEvent.click(screen.getByTestId("provoke-core"));

    // After provoke, toolbar should be gone (clearSelection)
    expect(screen.queryByTestId("floating-toolbar")).not.toBeInTheDocument();
  });

  it("Settings 버튼 → SettingsDialog 표시", async () => {
    render(<ReadingView mode="understand" />);

    // Click the NavBar Settings button (first one)
    const settingsButtons = screen.getAllByText("Settings");
    await userEvent.click(settingsButtons[0]);

    expect(screen.getByTestId("settings-dialog")).toBeInTheDocument();
  });

  it("샘플 PDF 버튼 → fileUrl 설정", async () => {
    // Mock fetch for sample.pdf
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(new Blob(["pdf"]), { status: 200 })
    );

    render(<ReadingView mode="understand" />);

    await userEvent.click(screen.getByText("샘플로 체험하기"));

    // Wait for async fetch
    await vi.waitFor(() => {
      expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
    });
  });
});
