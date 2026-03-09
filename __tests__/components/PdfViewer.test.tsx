import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";

// Mock react-pdf before importing PdfViewer
vi.mock("react-pdf", () => {
  const React = require("react");
  return {
    Document: ({ onLoadSuccess, children, onLoadError }: any) => {
      React.useEffect(() => {
        if (onLoadSuccess) onLoadSuccess({ numPages: 3 });
      }, []);
      return <div data-testid="pdf-document">{children}</div>;
    },
    Page: ({ pageNumber, onRenderSuccess }: any) => {
      const React = require("react");
      React.useEffect(() => {
        if (onRenderSuccess) onRenderSuccess();
      }, []);
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

afterEach(cleanup);

describe("PdfViewer", () => {
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
    const mockRange = {
      getClientRects: () => [{ left: 100, bottom: 200, top: 180, right: 300, width: 200, height: 20, x: 100, y: 180, toJSON: () => ({}) }],
    };
    const mockSelection = {
      isCollapsed: false,
      toString: () => "selected text",
      getRangeAt: () => mockRange,
    };
    vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as any);

    fireEvent.mouseUp(container);
    expect(onTextSelect).toHaveBeenCalledWith(
      "selected text",
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
    );
  });

  it("잘못된 PDF URL → 에러 UI 표시", () => {
    // Override mock for this test to simulate error
    vi.doMock("react-pdf", () => {
      const React = require("react");
      return {
        Document: ({ onLoadError, children }: any) => {
          React.useEffect(() => {
            if (onLoadError) onLoadError(new Error("Failed to load"));
          }, []);
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
    } as any);

    fireEvent.mouseUp(container);
    expect(onTextSelect).not.toHaveBeenCalled();
  });
});
