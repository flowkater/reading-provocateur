import { beforeEach, describe, expect, it } from "vitest";
import {
  getReadingSession,
  listRecentDocuments,
  listReadingSessions,
  saveRecentDocument,
  saveReadingSession,
  updateReadingSession,
} from "../../src/lib/reading-history";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("reading-history", () => {
  it("최근 문서는 같은 id면 upsert 되고 최신순으로 정렬", () => {
    saveRecentDocument({
      id: "doc-1",
      type: "article",
      title: "첫 글",
      addedAt: "2026-03-09T00:00:00.000Z",
      lastOpenedAt: "2026-03-09T00:00:00.000Z",
      lastSessionId: "session-1",
      articleSnapshot: {
        id: "article-1",
        url: "https://example.com/1",
        title: "첫 글",
        content: "content",
        htmlContent: "<p>content</p>",
        charCount: 7,
        addedAt: "2026-03-09T00:00:00.000Z",
      },
    });

    saveRecentDocument({
      id: "doc-1",
      type: "article",
      title: "첫 글 수정",
      addedAt: "2026-03-09T00:00:00.000Z",
      lastOpenedAt: "2026-03-10T00:00:00.000Z",
      lastSessionId: "session-2",
      articleSnapshot: {
        id: "article-1",
        url: "https://example.com/1",
        title: "첫 글 수정",
        content: "content",
        htmlContent: "<p>content</p>",
        charCount: 7,
        addedAt: "2026-03-09T00:00:00.000Z",
      },
    });

    saveRecentDocument({
      id: "doc-2",
      type: "pdf",
      title: "둘째 PDF",
      addedAt: "2026-03-08T00:00:00.000Z",
      lastOpenedAt: "2026-03-08T00:00:00.000Z",
      lastSessionId: "session-3",
      pdfMeta: {
        fileName: "second.pdf",
      },
    });

    const docs = listRecentDocuments();
    expect(docs).toHaveLength(2);
    expect(docs[0].id).toBe("doc-1");
    expect(docs[0].title).toBe("첫 글 수정");
  });

  it("세션 저장/조회/업데이트가 된다", () => {
    saveReadingSession({
      id: "session-1",
      documentId: "doc-1",
      documentType: "pdf",
      title: "테스트 PDF",
      mode: "understand",
      startedAt: "2026-03-09T00:00:00.000Z",
      endedAt: null,
      currentPage: 5,
      firstPage: 1,
      lastPage: 5,
      restorable: true,
      pdfResume: {
        fileName: "test.pdf",
        needsFileReconnect: true,
      },
    });

    updateReadingSession("session-1", {
      currentPage: 12,
      lastPage: 12,
      mode: "exam",
    });

    const session = getReadingSession("session-1");
    expect(session).not.toBeNull();
    expect(session?.currentPage).toBe(12);
    expect(session?.mode).toBe("exam");
  });

  it("최근 세션은 최신순으로 정렬된다", () => {
    saveReadingSession({
      id: "session-1",
      documentId: "doc-1",
      documentType: "article",
      title: "먼저 본 글",
      mode: "understand",
      startedAt: "2026-03-09T00:00:00.000Z",
      endedAt: "2026-03-09T00:05:00.000Z",
      currentPage: 1,
      firstPage: 1,
      lastPage: 1,
      restorable: true,
      articleResume: { articleId: "article-1" },
    });

    saveReadingSession({
      id: "session-2",
      documentId: "doc-2",
      documentType: "pdf",
      title: "나중 PDF",
      mode: "apply",
      startedAt: "2026-03-10T00:00:00.000Z",
      endedAt: null,
      currentPage: 8,
      firstPage: 1,
      lastPage: 8,
      restorable: true,
      pdfResume: {
        fileName: "later.pdf",
        needsFileReconnect: true,
      },
    });

    const sessions = listReadingSessions();
    expect(sessions.map((session) => session.id)).toEqual([
      "session-2",
      "session-1",
    ]);
  });
});
