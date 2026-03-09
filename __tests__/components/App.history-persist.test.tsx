import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { listRecentDocuments, listReadingSessions } from "../../src/lib/reading-history";

const savePdfBlobMock = vi.fn();

vi.mock("../../src/components/ReadingView", () => ({
  ReadingView: ({
    mode,
    onArticleLoaded,
    onPdfLoaded,
    onTextLoaded,
  }: {
    mode: string;
    onArticleLoaded?: (article: {
      id: string;
      url: string;
      title: string;
      content: string;
      htmlContent: string;
      charCount: number;
      addedAt: string;
    }) => void;
    onPdfLoaded?: (file: File) => void;
    onTextLoaded?: (doc: {
      id: string;
      title: string;
      content: string;
      charCount: number;
      addedAt: string;
    }) => void;
  }) => (
    <div data-testid="reading-view" data-mode={mode}>
      <button
        onClick={() =>
          onArticleLoaded?.({
            id: "article-1",
            url: "https://example.com/post",
            title: "저장된 글",
            content: "content",
            htmlContent: "<p>content</p>",
            charCount: 7,
            addedAt: "2026-03-09T00:00:00.000Z",
          })
        }
      >
        아티클 저장
      </button>
      <button
        onClick={() =>
          onPdfLoaded?.(
            new File(["pdf"], "saved.pdf", {
              type: "application/pdf",
              lastModified: 0,
            })
          )
        }
      >
        PDF 저장
      </button>
      <button
        onClick={() =>
          onTextLoaded?.({
            id: "text-1",
            title: "붙여넣은 텍스트",
            content: "첫 문장\n둘째 문장",
            charCount: 9,
            addedAt: "2026-03-09T00:00:00.000Z",
          })
        }
      >
        텍스트 저장
      </button>
    </div>
  ),
}));

vi.mock("../../src/lib/pdf-storage", () => ({
  computePdfFingerprint: (file: File) => `${file.name}:${file.size}:${file.lastModified}`,
  savePdfBlob: (...args: unknown[]) => savePdfBlobMock(...args),
  getPdfBlob: vi.fn(),
  touchPdfBlob: vi.fn(),
  deletePdfBlob: vi.fn(),
  pruneStoredPdfs: vi.fn().mockResolvedValue({ deletedBlobIds: [] }),
  getPdfBlobByFingerprint: vi.fn().mockResolvedValue(null),
}));

import App from "../../src/App";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  savePdfBlobMock.mockResolvedValue({
    id: "blob-1",
    fingerprint: "saved.pdf:3:0",
    fileName: "saved.pdf",
    size: 3,
    mimeType: "application/pdf",
    createdAt: "2026-03-09T00:00:00.000Z",
    lastAccessedAt: "2026-03-09T00:00:00.000Z",
  });
});

afterEach(cleanup);

describe("App history persistence", () => {
  it("새 아티클 세션을 저장하고 세션 route로 이동", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("이해"));
    await userEvent.click(screen.getByText("아티클 저장"));

    expect(listRecentDocuments()[0].type).toBe("article");
    expect(listReadingSessions()[0].documentType).toBe("article");
    expect(window.location.pathname).toMatch(/^\/reading\//);
  });

  it("새 PDF 세션을 저장하고 세션 route로 이동", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("이해"));
    await userEvent.click(screen.getByText("PDF 저장"));

    await waitFor(() => {
      expect(listRecentDocuments()[0].pdfMeta?.pdfBlobId).toBe("blob-1");
      expect(listReadingSessions()[0].pdfResume?.pdfBlobId).toBe("blob-1");
      expect(listReadingSessions()[0].documentId).toBe("pdf:saved.pdf:3:0");
      expect(window.location.pathname).toMatch(/^\/reading\//);
    });
  });

  it("PDF blob 저장 실패 시 non-restorable 세션으로 degrade", async () => {
    savePdfBlobMock.mockRejectedValueOnce(new Error("Quota exceeded"));

    render(<App />);

    await userEvent.click(screen.getByText("이해"));
    await userEvent.click(screen.getByText("PDF 저장"));

    await waitFor(() => {
      expect(listRecentDocuments()[0].pdfMeta?.pdfBlobId).toBeUndefined();
      expect(listReadingSessions()[0].restorable).toBe(false);
      expect(window.location.pathname).toMatch(/^\/reading\//);
    });
  });

  it("새 plain text 세션을 저장하고 세션 route로 이동", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("이해"));
    await userEvent.click(screen.getByText("텍스트 저장"));

    await waitFor(() => {
      expect(listRecentDocuments()[0].type).toBe("text");
      expect(listRecentDocuments()[0].textSnapshot?.content).toBe(
        "첫 문장\n둘째 문장"
      );
      expect(listReadingSessions()[0].documentType).toBe("text");
      expect(window.location.pathname).toMatch(/^\/reading\//);
    });
  });
});
