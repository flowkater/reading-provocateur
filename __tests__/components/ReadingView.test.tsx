import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import type { HighlightIntent, Provocation } from "../../src/types";

interface MockPdfViewerProps {
  currentPage: number;
  onTextSelect: (
    text: string,
    position: { x: number; y: number },
    selectionData?: unknown
  ) => void;
  onPageTextExtract: (text: string) => void;
}

interface MockArticleViewerProps {
  article: {
    title: string;
  };
  onTextSelect: (
    text: string,
    position: { x: number; y: number },
    selectionData?: unknown
  ) => void;
}

interface MockSidePanelProps {
  state: string;
  onOpenSettings: () => void;
}

interface MockToolbarProps {
  onHighlight: () => void;
  onProvoke: (intent: HighlightIntent) => void;
  onClose: () => void;
}

interface MockSettingsDialogProps {
  onClose: () => void;
}

const useProvocationFlowMock = vi.fn();
const useAnnotationsMock = vi.fn();

// Mock heavy components — PdfViewer is lazy-loaded so needs both named + default export
const MockPdfViewer = (props: MockPdfViewerProps) => (
  <div data-testid="pdf-viewer" data-page={props.currentPage}>
    <button
      data-testid="simulate-text-select"
      onClick={() =>
        props.onTextSelect("selected text", { x: 100, y: 200 }, {
          contentType: "pdf",
          pageNumber: 1,
          highlightAreas: [
            { pageIndex: 0, left: 0.1, top: 0.2, width: 0.3, height: 0.05 },
          ],
        })
      }
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
  ArticleViewer: (props: MockArticleViewerProps) => (
    <div data-testid="article-viewer">
      <h1>{props.article.title}</h1>
      <button
        data-testid="simulate-article-text-select"
        onClick={() =>
          props.onTextSelect("article selected text", { x: 150, y: 250 }, {
            contentType: "article",
            pageNumber: 1,
            quote: "article selected text",
            contextBefore: "before",
            contextAfter: "after",
          })
        }
      >
        Select Article Text
      </button>
    </div>
  ),
}));

vi.mock("../../src/components/SidePanel", () => ({
  SidePanel: (props: MockSidePanelProps) => (
    <div data-testid="side-panel" data-state={props.state}>
      <button data-testid="open-settings-from-panel" onClick={props.onOpenSettings}>
        Settings
      </button>
    </div>
  ),
}));

vi.mock("../../src/components/FloatingToolbar", () => ({
  FloatingToolbar: (props: MockToolbarProps) => (
    <div data-testid="floating-toolbar">
      <button data-testid="highlight" onClick={props.onHighlight}>
        Highlight
      </button>
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
  SettingsDialog: (props: MockSettingsDialogProps) => (
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
  Document: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
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

vi.mock("../../src/hooks/useProvocationFlow", () => ({
  useProvocationFlow: (...args: unknown[]) => useProvocationFlowMock(...args),
}));

vi.mock("../../src/hooks/useAnnotations", () => ({
  useAnnotations: (...args: unknown[]) => useAnnotationsMock(...args),
}));

import { ReadingView } from "../../src/components/ReadingView";

// Polyfill URL.createObjectURL for jsdom
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
  URL.revokeObjectURL = vi.fn();
}

afterEach(cleanup);

const baseProvocation: Provocation = {
  id: "prov-1",
  bookId: "book-1",
  annotationId: null,
  pageNumber: 1,
  selectedText: "selected text",
  contextExcerpt: "context",
  sessionMode: "understand",
  intent: "core",
  kind: "recall",
  question: "질문?",
  answer: null,
  confidence: null,
  createdAt: "2026-03-09T00:00:00.000Z",
  answeredAt: null,
  evaluation: null,
  modelAnswer: null,
};

function makeFlow(overrides: Partial<ReturnType<typeof createFlow>> = {}) {
  return { ...createFlow(), ...overrides };
}

function createFlow() {
  return {
    state: "empty",
    currentProvocation: null as Provocation | null,
    error: null as string | null,
    history: [] as Provocation[],
    startProvocation: vi.fn(),
    submitAnswer: vi.fn(),
    submitRetry: vi.fn(),
    skipRetry: vi.fn(),
    showAnswer: vi.fn(),
    saveAndNext: vi.fn(),
    reset: vi.fn(),
  };
}

function createAnnotations() {
  return {
    annotations: [],
    saveSelectionAsAnnotation: vi.fn().mockReturnValue("annotation-1"),
  };
}

describe("ReadingView", () => {
  afterEach(() => {
    useProvocationFlowMock.mockReset();
    useProvocationFlowMock.mockReturnValue(makeFlow());
    useAnnotationsMock.mockReset();
    useAnnotationsMock.mockReturnValue(createAnnotations());
  });

  it("NavBar/BottomBar 렌더링", () => {
    useProvocationFlowMock.mockReturnValue(makeFlow());
    useAnnotationsMock.mockReturnValue(createAnnotations());
    render(<ReadingView mode="understand" />);
    // NavBar has the mode badge
    expect(screen.getByText("이해")).toBeInTheDocument();
  });

  it("파일 없을 때 ContentSelector 표시", () => {
    useProvocationFlowMock.mockReturnValue(makeFlow());
    useAnnotationsMock.mockReturnValue(createAnnotations());
    render(<ReadingView mode="understand" />);
    expect(screen.getByText("PDF 파일")).toBeInTheDocument();
    expect(screen.getByText("웹 아티클")).toBeInTheDocument();
  });

  it("파일 드롭 → PdfViewer 렌더링", async () => {
    useProvocationFlowMock.mockReturnValue(makeFlow());
    useAnnotationsMock.mockReturnValue(createAnnotations());
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
    useProvocationFlowMock.mockReturnValue(makeFlow());
    useAnnotationsMock.mockReturnValue(createAnnotations());
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
    const flow = makeFlow();
    const annotations = createAnnotations();
    useProvocationFlowMock.mockReturnValue(flow);
    useAnnotationsMock.mockReturnValue(annotations);
    render(<ReadingView mode="understand" onModeChange={vi.fn()} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByTestId("simulate-text-select")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("simulate-text-select"));
    fireEvent.click(screen.getByTestId("provoke-core"));

    expect(annotations.saveSelectionAsAnnotation).toHaveBeenCalledWith(
      "selected text",
      expect.anything(),
      "core"
    );
    expect(flow.startProvocation).toHaveBeenCalledWith({
      selectedText: "selected text",
      intent: "core",
      annotationId: "annotation-1",
    });
    expect(screen.queryByTestId("floating-toolbar")).not.toBeInTheDocument();
  });

  it("FloatingToolbar에서 Highlight 클릭 → plain annotation 저장", async () => {
    useProvocationFlowMock.mockReturnValue(makeFlow());
    const annotations = createAnnotations();
    useAnnotationsMock.mockReturnValue(annotations);
    render(<ReadingView mode="understand" onModeChange={vi.fn()} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByTestId("simulate-text-select")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("simulate-text-select"));
    await userEvent.click(screen.getByTestId("highlight"));

    expect(annotations.saveSelectionAsAnnotation).toHaveBeenCalledWith(
      "selected text",
      expect.anything(),
      null
    );
  });

  it("Settings 버튼 → SettingsDialog 표시", async () => {
    useProvocationFlowMock.mockReturnValue(makeFlow());
    useAnnotationsMock.mockReturnValue(createAnnotations());
    render(<ReadingView mode="understand" />);

    // Click the NavBar Settings button (first one)
    const settingsButtons = screen.getAllByText("Settings");
    await userEvent.click(settingsButtons[0]);

    expect(screen.getByTestId("settings-dialog")).toBeInTheDocument();
  });

  it("샘플 PDF 버튼 → fileUrl 설정", async () => {
    useProvocationFlowMock.mockReturnValue(makeFlow());
    useAnnotationsMock.mockReturnValue(createAnnotations());
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

  it("idle 상태에서는 모드 변경이 즉시 반영", async () => {
    useProvocationFlowMock.mockReturnValue(makeFlow({ state: "saved" }));
    useAnnotationsMock.mockReturnValue(createAnnotations());
    const onModeChange = vi.fn();
    render(<ReadingView mode="understand" onModeChange={onModeChange} />);

    await userEvent.click(screen.getByRole("button", { name: "이해" }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: "시험" }));

    expect(onModeChange).toHaveBeenCalledWith("exam");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("진행 중 도발 상태에서는 모드 변경 전에 확인 다이얼로그를 띄움", async () => {
    const flow = makeFlow({
      state: "question",
      currentProvocation: baseProvocation,
    });
    useProvocationFlowMock.mockReturnValue(flow);
    useAnnotationsMock.mockReturnValue(createAnnotations());
    const onModeChange = vi.fn();
    render(<ReadingView mode="understand" onModeChange={onModeChange} />);

    await userEvent.click(screen.getByRole("button", { name: "이해" }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: "시험" }));

    expect(onModeChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText("모드를 바꾸면 현재 도발 흐름이 사라집니다. 전환할까요?")
    ).toBeInTheDocument();
  });

  it("확인 다이얼로그에서 전환 클릭 시 reset 후 mode 변경", async () => {
    const flow = makeFlow({
      state: "question",
      currentProvocation: baseProvocation,
    });
    useProvocationFlowMock.mockReturnValue(flow);
    useAnnotationsMock.mockReturnValue(createAnnotations());
    const onModeChange = vi.fn();
    render(<ReadingView mode="understand" onModeChange={onModeChange} />);

    await userEvent.click(screen.getByRole("button", { name: "이해" }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: "시험" }));
    await userEvent.click(screen.getByRole("button", { name: "전환" }));

    expect(flow.reset).toHaveBeenCalledOnce();
    expect(onModeChange).toHaveBeenCalledWith("exam");
  });
});
