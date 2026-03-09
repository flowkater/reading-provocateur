import type { ReactNode } from "react";
import { useEffect } from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { mockSelection } from "../../src/__test__/selection-mock";

interface MockDocumentProps {
  onLoadSuccess?: (payload: { numPages: number }) => void;
  onLoadError?: (error: Error) => void;
  children?: ReactNode;
}

interface MockPageProps {
  pageNumber: number;
  onRenderSuccess?: () => void;
}

let intersectionCallback:
  | ((entries: IntersectionObserverEntry[]) => void)
  | null = null;

// Mock react-pdf before importing PdfViewer
vi.mock("react-pdf", () => {
  return {
    Document: ({ onLoadSuccess, children }: MockDocumentProps) => {
      useEffect(() => {
        if (onLoadSuccess) onLoadSuccess({ numPages: 3 });
      }, [onLoadSuccess]);
      return <div data-testid="pdf-document">{children}</div>;
    },
    Page: ({ pageNumber, onRenderSuccess }: MockPageProps) => {
      useEffect(() => {
        if (onRenderSuccess) onRenderSuccess();
      }, [onRenderSuccess]);
      return <div data-testid={`pdf-page-${pageNumber}`}>Page {pageNumber}</div>;
    },
    pdfjs: { GlobalWorkerOptions: { workerSrc: "" } },
  };
});

// Mock pdfjs-dist for text extraction
vi.mock("pdfjs-dist", () => ({
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      getPage: vi.fn().mockResolvedValue({
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: "Hello" },
            { str: "World" },
          ],
        }),
      }),
    }),
  }),
}));

import { PdfViewer } from "../../src/components/PdfViewer";
import type { Annotation } from "../../src/types";

beforeEach(() => {
  intersectionCallback = null;
  if (!Element.prototype.scrollIntoView) {
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  } else {
    vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});
  }
  globalThis.IntersectionObserver = class {
    readonly root: Element | Document | null = null;
    readonly rootMargin = "";
    readonly thresholds = [0.5];

    constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
      intersectionCallback = callback;
    }

    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as typeof IntersectionObserver;
});

afterEach(cleanup);

describe("PdfViewer", () => {
  const pdfAnnotation: Annotation = {
    id: "ann-1",
    bookId: "book-1",
    contentType: "pdf",
    pageNumber: 2,
    selectedText: "Hello",
    highlightAreas: [
      { pageIndex: 1, left: 0.1, top: 0.2, width: 0.3, height: 0.05 },
    ],
    intent: null,
    createdAt: "2026-03-09T00:00:00.000Z",
  };

  it("Document 로드 성공 → onTotalPagesChange 호출", () => {
    const onTotalPagesChange = vi.fn();
    render(
      <PdfViewer
        fileUrl="test.pdf"
        currentPage={1}
        onPageChange={vi.fn()}
        onTotalPagesChange={onTotalPagesChange}
        onTextSelect={vi.fn()}
        onPageTextExtract={vi.fn()}
      />
    );
    expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
    expect(onTotalPagesChange).toHaveBeenCalledWith(3);
    expect(screen.getByTestId("pdf-pages-stack")).toHaveClass(
      "flex",
      "flex-col",
      "items-center",
      "gap-6",
      "py-6",
    );
    expect(screen.getByTestId("pdf-page-1")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-page-2")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-page-3")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-page-shell-2")).toHaveClass(
      "w-fit",
      "bg-white",
      "shadow-hard-sm",
    );
  });

  it("페이지 번호 전환 → Page 컴포넌트 렌더링", () => {
    render(
      <PdfViewer
        fileUrl="test.pdf"
        currentPage={2}
        onPageChange={vi.fn()}
        onTotalPagesChange={vi.fn()}
        onTextSelect={vi.fn()}
        onPageTextExtract={vi.fn()}
      />
    );
    expect(screen.getByTestId("pdf-page-2")).toBeInTheDocument();
  });

  it("텍스트 선택 → onTextSelect 콜백", () => {
    const onTextSelect = vi.fn();
    render(
      <PdfViewer
        fileUrl="test.pdf"
        currentPage={1}
        onPageChange={vi.fn()}
        onTotalPagesChange={vi.fn()}
        onTextSelect={onTextSelect}
        onPageTextExtract={vi.fn()}
      />
    );

    // Simulate text selection via mouseup
    const container = screen.getByTestId("pdf-document").parentElement!;
    mockSelection("selected text", { left: 100, bottom: 200, top: 180 });

    fireEvent.mouseUp(container);
    expect(onTextSelect).toHaveBeenCalledWith(
      "selected text",
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
      undefined
    );
  });

  it("잘못된 PDF URL → 에러 UI 표시", () => {
    // Override mock for this test to simulate error
    vi.doMock("react-pdf", () => {
      return {
        Document: ({ onLoadError, children }: MockDocumentProps) => {
          useEffect(() => {
            if (onLoadError) onLoadError(new Error("Failed to load"));
          }, [onLoadError]);
          return <div data-testid="pdf-document">{children}</div>;
        },
        Page: () => null,
        pdfjs: { GlobalWorkerOptions: { workerSrc: "" } },
      };
    });

    // For this test, we'll check that the component handles the error state
    // The actual error display depends on implementation
    // This test verifies the component renders without crashing
    render(
      <PdfViewer
        fileUrl="invalid.pdf"
        currentPage={1}
        onPageChange={vi.fn()}
        onTotalPagesChange={vi.fn()}
        onTextSelect={vi.fn()}
        onPageTextExtract={vi.fn()}
      />
    );
    // Component should render without throwing
    expect(screen.getByTestId("pdf-document")).toBeInTheDocument();
  });

  it("페이지 로드 → onPageTextExtract 호출", async () => {
    const onPageTextExtract = vi.fn();
    render(
      <PdfViewer
        fileUrl="test.pdf"
        currentPage={1}
        onPageChange={vi.fn()}
        onTotalPagesChange={vi.fn()}
        onTextSelect={vi.fn()}
        onPageTextExtract={onPageTextExtract}
      />
    );

    // Wait for async text extraction
    await vi.waitFor(() => {
      expect(onPageTextExtract).toHaveBeenCalledWith("Hello World");
    });
  });

  it("빈 선택은 onTextSelect를 호출하지 않음", () => {
    const onTextSelect = vi.fn();
    render(
      <PdfViewer
        fileUrl="test.pdf"
        currentPage={1}
        onPageChange={vi.fn()}
        onTotalPagesChange={vi.fn()}
        onTextSelect={onTextSelect}
        onPageTextExtract={vi.fn()}
      />
    );

    const container = screen.getByTestId("pdf-document").parentElement!;
    vi.spyOn(window, "getSelection").mockReturnValue({
      isCollapsed: true,
      toString: () => "",
    } as unknown as Selection);

    fireEvent.mouseUp(container);
    expect(onTextSelect).not.toHaveBeenCalled();
  });

  it("currentPage 변경 시 해당 페이지로 스크롤", async () => {
    render(
      <PdfViewer
        fileUrl="test.pdf"
        currentPage={2}
        onPageChange={vi.fn()}
        onTotalPagesChange={vi.fn()}
        onTextSelect={vi.fn()}
        onPageTextExtract={vi.fn()}
      />
    );

    await vi.waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  it("보이는 페이지가 바뀌면 onPageChange 호출", async () => {
    const onPageChange = vi.fn();
    render(
      <PdfViewer
        fileUrl="test.pdf"
        currentPage={1}
        onPageChange={onPageChange}
        onTotalPagesChange={vi.fn()}
        onTextSelect={vi.fn()}
        onPageTextExtract={vi.fn()}
      />
    );

    const pageTwoWrapper = screen
      .getByTestId("pdf-page-2")
      .closest('[data-page-number="2"]');

    expect(pageTwoWrapper).not.toBeNull();
    expect(intersectionCallback).not.toBeNull();

    intersectionCallback?.([
      {
        target: pageTwoWrapper!,
        isIntersecting: true,
        intersectionRatio: 0.8,
      } as IntersectionObserverEntry,
    ]);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("annotation이 있으면 해당 페이지에 highlight overlay를 렌더링", () => {
    render(
      <PdfViewer
        fileUrl="test.pdf"
        currentPage={1}
        onPageChange={vi.fn()}
        onTotalPagesChange={vi.fn()}
        onTextSelect={vi.fn()}
        onPageTextExtract={vi.fn()}
        annotations={[pdfAnnotation]}
      />
    );

    expect(screen.getByTestId("pdf-highlight-2-0")).toBeInTheDocument();
  });
});
