import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { saveRecentDocument, saveReadingSession } from "../../src/lib/reading-history";

const getPdfBlobMock = vi.fn();

vi.mock("../../src/components/ReadingView", () => ({
  ReadingView: ({
    mode,
    initialArticle,
    initialPdfBlobUrl,
    initialTextDocument,
  }: {
    mode: string;
    initialArticle?: { title: string } | null;
    initialPdfBlobUrl?: string | null;
    initialTextDocument?: { title: string } | null;
  }) => (
    <div
      data-testid="reading-view"
      data-mode={mode}
      data-has-article={initialArticle ? "yes" : "no"}
      data-has-pdf={initialPdfBlobUrl ? "yes" : "no"}
      data-has-text={initialTextDocument ? "yes" : "no"}
    />
  ),
}));

vi.mock("../../src/lib/pdf-storage", () => ({
  getPdfBlob: (...args: unknown[]) => getPdfBlobMock(...args),
  savePdfBlob: vi.fn(),
  touchPdfBlob: vi.fn(),
  deletePdfBlob: vi.fn(),
  pruneStoredPdfs: vi.fn().mockResolvedValue({ deletedBlobIds: [] }),
  getPdfBlobByFingerprint: vi.fn(),
}));

import App from "../../src/App";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

beforeEach(() => {
  URL.createObjectURL = vi.fn().mockReturnValue("blob:restored-pdf");
  URL.revokeObjectURL = vi.fn();
});

describe("App restore routes", () => {
  it("article 세션 route 진입 시 ReadingView를 article 복원 상태로 렌더링", async () => {
    getPdfBlobMock.mockResolvedValue(null);
    saveRecentDocument({
      id: "doc-article",
      type: "article",
      title: "복원 글",
      addedAt: "2026-03-09T00:00:00.000Z",
      lastOpenedAt: "2026-03-10T00:00:00.000Z",
      lastSessionId: "session-article",
      articleSnapshot: {
        id: "article-1",
        url: "https://example.com/post",
        title: "복원 글",
        content: "content",
        htmlContent: "<p>content</p>",
        charCount: 7,
        addedAt: "2026-03-09T00:00:00.000Z",
      },
    });

    saveReadingSession({
      id: "session-article",
      documentId: "doc-article",
      documentType: "article",
      title: "복원 글",
      mode: "critique",
      startedAt: "2026-03-10T00:00:00.000Z",
      endedAt: null,
      currentPage: 1,
      firstPage: 1,
      lastPage: 1,
      restorable: true,
      articleResume: { articleId: "article-1" },
    });

    window.history.replaceState({}, "", "/reading/session-article");
    render(<App />);

    expect(await screen.findByTestId("reading-view")).toHaveAttribute(
      "data-mode",
      "critique"
    );
    expect(screen.getByTestId("reading-view")).toHaveAttribute(
      "data-has-article",
      "yes"
    );
  });

  it("pdf 세션 route 진입 시 파일 재선택 복원 UI를 보여준다", async () => {
    saveRecentDocument({
      id: "doc-pdf",
      type: "pdf",
      title: "복원 PDF",
      addedAt: "2026-03-09T00:00:00.000Z",
      lastOpenedAt: "2026-03-10T00:00:00.000Z",
      lastSessionId: "session-pdf",
      pdfMeta: { fileName: "restore.pdf", pdfBlobId: "blob-1", fingerprint: "f", size: 10, mimeType: "application/pdf", persistedAt: "2026-03-10T00:00:00.000Z" },
    });

    saveReadingSession({
      id: "session-pdf",
      documentId: "doc-pdf",
      documentType: "pdf",
      title: "복원 PDF",
      mode: "understand",
      startedAt: "2026-03-10T00:00:00.000Z",
      endedAt: null,
      currentPage: 17,
      firstPage: 1,
      lastPage: 17,
      restorable: true,
      pdfResume: {
        fileName: "restore.pdf",
        pdfBlobId: "blob-1",
        fingerprint: "f",
      },
    });

    getPdfBlobMock.mockResolvedValue(new Blob(["pdf-data"], { type: "application/pdf" }));
    window.history.replaceState({}, "", "/reading/session-pdf");
    render(<App />);

    expect(
      await screen.findByTestId("reading-view")
    ).toHaveAttribute("data-has-pdf", "yes");
  });

  it("pdf blob 조회 실패 시 파일 재선택 복원 UI를 보여준다", async () => {
    saveRecentDocument({
      id: "doc-pdf",
      type: "pdf",
      title: "복원 PDF",
      addedAt: "2026-03-09T00:00:00.000Z",
      lastOpenedAt: "2026-03-10T00:00:00.000Z",
      lastSessionId: "session-pdf",
      pdfMeta: { fileName: "restore.pdf", pdfBlobId: "blob-1", fingerprint: "f", size: 10, mimeType: "application/pdf", persistedAt: "2026-03-10T00:00:00.000Z" },
    });

    saveReadingSession({
      id: "session-pdf",
      documentId: "doc-pdf",
      documentType: "pdf",
      title: "복원 PDF",
      mode: "understand",
      startedAt: "2026-03-10T00:00:00.000Z",
      endedAt: null,
      currentPage: 17,
      firstPage: 1,
      lastPage: 17,
      restorable: true,
      pdfResume: {
        fileName: "restore.pdf",
        pdfBlobId: "blob-1",
        fingerprint: "f",
      },
    });

    getPdfBlobMock.mockResolvedValue(null);
    window.history.replaceState({}, "", "/reading/session-pdf");
    render(<App />);

    expect(await screen.findByText("이전 PDF 세션 복원")).toBeInTheDocument();
  });

  it("pdf blob 복원 중 예외가 나도 파일 재선택 복원 UI로 degrade", async () => {
    saveRecentDocument({
      id: "doc-pdf",
      type: "pdf",
      title: "복원 PDF",
      addedAt: "2026-03-09T00:00:00.000Z",
      lastOpenedAt: "2026-03-10T00:00:00.000Z",
      lastSessionId: "session-pdf",
      pdfMeta: { fileName: "restore.pdf", pdfBlobId: "blob-1", fingerprint: "f", size: 10, mimeType: "application/pdf", persistedAt: "2026-03-10T00:00:00.000Z" },
    });

    saveReadingSession({
      id: "session-pdf",
      documentId: "doc-pdf",
      documentType: "pdf",
      title: "복원 PDF",
      mode: "understand",
      startedAt: "2026-03-10T00:00:00.000Z",
      endedAt: null,
      currentPage: 17,
      firstPage: 1,
      lastPage: 17,
      restorable: true,
      pdfResume: {
        fileName: "restore.pdf",
        pdfBlobId: "blob-1",
        fingerprint: "f",
      },
    });

    getPdfBlobMock.mockRejectedValueOnce(new Error("IndexedDB broken"));
    window.history.replaceState({}, "", "/reading/session-pdf");
    render(<App />);

    expect(await screen.findByText("이전 PDF 세션 복원")).toBeInTheDocument();
  });

  it("plain text 세션 route 진입 시 ReadingView를 text 복원 상태로 렌더링", async () => {
    saveRecentDocument({
      id: "doc-text",
      type: "text",
      title: "붙여넣은 텍스트",
      addedAt: "2026-03-09T00:00:00.000Z",
      lastOpenedAt: "2026-03-10T00:00:00.000Z",
      lastSessionId: "session-text",
      textSnapshot: {
        id: "text-1",
        title: "붙여넣은 텍스트",
        content: "첫 문장\n둘째 문장",
        charCount: 9,
        addedAt: "2026-03-09T00:00:00.000Z",
      },
    });

    saveReadingSession({
      id: "session-text",
      documentId: "doc-text",
      documentType: "text",
      title: "붙여넣은 텍스트",
      mode: "apply",
      startedAt: "2026-03-10T00:00:00.000Z",
      endedAt: null,
      currentPage: 1,
      firstPage: 1,
      lastPage: 1,
      restorable: true,
    });

    window.history.replaceState({}, "", "/reading/session-text");
    render(<App />);

    expect(await screen.findByTestId("reading-view")).toHaveAttribute(
      "data-has-text",
      "yes"
    );
  });
});
