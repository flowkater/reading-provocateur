import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeScreen } from "../../src/components/HomeScreen";
import type { ReadingSessionRecord, RecentDocumentRecord } from "../../src/types";

afterEach(cleanup);

const recentDocuments: RecentDocumentRecord[] = [
  {
    id: "doc-pdf",
    type: "pdf",
    title: "DDD.pdf",
    addedAt: "2026-03-09T00:00:00.000Z",
    lastOpenedAt: "2026-03-10T00:00:00.000Z",
    lastSessionId: "session-pdf",
    pdfMeta: { fileName: "ddd.pdf" },
  },
  {
    id: "doc-article",
    type: "article",
    title: "좋은 글",
    addedAt: "2026-03-09T00:00:00.000Z",
    lastOpenedAt: "2026-03-11T00:00:00.000Z",
    lastSessionId: "session-article",
    articleSnapshot: {
      id: "article-1",
      url: "https://example.com/post",
      title: "좋은 글",
      content: "content",
      htmlContent: "<p>content</p>",
      charCount: 7,
      addedAt: "2026-03-09T00:00:00.000Z",
    },
  },
  {
    id: "doc-text",
    type: "text",
    title: "붙여넣은 텍스트",
    addedAt: "2026-03-09T00:00:00.000Z",
    lastOpenedAt: "2026-03-12T00:00:00.000Z",
    lastSessionId: "session-text",
    textSnapshot: {
      id: "text-1",
      title: "붙여넣은 텍스트",
      content: "첫 문장\n둘째 문장",
      charCount: 10,
      addedAt: "2026-03-09T00:00:00.000Z",
    },
  },
];

const recentSessions: ReadingSessionRecord[] = [
  {
    id: "session-pdf",
    documentId: "doc-pdf",
    documentType: "pdf",
    title: "DDD.pdf",
    mode: "understand",
    startedAt: "2026-03-10T00:00:00.000Z",
    endedAt: null,
    currentPage: 24,
    firstPage: 1,
    lastPage: 24,
    restorable: true,
    pdfResume: {
      fileName: "ddd.pdf",
      needsFileReconnect: true,
    },
  },
  {
    id: "session-text",
    documentId: "doc-text",
    documentType: "text",
    title: "붙여넣은 텍스트",
    mode: "apply",
    startedAt: "2026-03-12T00:00:00.000Z",
    endedAt: null,
    currentPage: 1,
    firstPage: 1,
    lastPage: 1,
    restorable: true,
    textResume: {
      textId: "text-1",
    },
  },
];

describe("HomeScreen", () => {
  it("최근 문서/최근 세션 목록을 렌더링", () => {
    render(
      <HomeScreen
        recentDocuments={recentDocuments}
        recentSessions={recentSessions}
        onModeSelect={vi.fn()}
        onOpenSession={vi.fn()}
      />
    );

    expect(screen.getByText("최근 문서")).toBeInTheDocument();
    expect(screen.getByText("최근 세션")).toBeInTheDocument();
    expect(screen.getAllByText("DDD.pdf")).toHaveLength(2);
    expect(screen.getByText("좋은 글")).toBeInTheDocument();
    expect(screen.getAllByText("붙여넣은 텍스트")).toHaveLength(2);
    expect(screen.getByText(/첫 문장/)).toBeInTheDocument();
  });

  it("최근 세션 클릭 → onOpenSession 호출", async () => {
    const onOpenSession = vi.fn();
    render(
      <HomeScreen
        recentDocuments={recentDocuments}
        recentSessions={recentSessions}
        onModeSelect={vi.fn()}
        onOpenSession={onOpenSession}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /p\.24/i }));

    expect(onOpenSession).toHaveBeenCalledWith("session-pdf");
  });
});
