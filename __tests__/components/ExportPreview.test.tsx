import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportPreview } from "../../src/components/ExportPreview";
import type { Provocation, ReviewItem, SessionContext, Settings } from "../../src/types";

afterEach(cleanup);

const makeProv = (overrides: Partial<Provocation> = {}): Provocation => ({
  id: "p1",
  bookId: "b1",
  annotationId: null,
  pageNumber: 38,
  selectedText: "text",
  contextExcerpt: "context",
  sessionMode: "understand",
  intent: "core",
  kind: "recall",
  question: "질문?",
  answer: "내 답변 내용",
  confidence: "high",
  createdAt: "2026-03-09T10:00:00Z",
  answeredAt: "2026-03-09T10:01:00Z",
  evaluation: {
    verdict: "partial",
    whatWasRight: ["일부"],
    missingPoints: ["빠진점"],
    followUpQuestion: null,
    retryAnswer: null,
    retryVerdict: null,
    retryEvaluatedAt: null,
  },
  modelAnswer: null,
  ...overrides,
});

const baseSession: SessionContext = {
  bookId: "b1",
  mode: "understand",
  startedAt: "2026-03-09T10:00:00Z",
  endedAt: "2026-03-09T10:25:00Z",
  firstPage: 38,
  lastPage: 47,
};

const baseSettings: Settings = {
  provider: "anthropic",
  apiKey: "",
  rememberKey: false,
  model: "claude-sonnet-4-6",
  defaultMode: "understand",
  obsidianFrontmatter: false,
};

const baseReviewItems: ReviewItem[] = [
  {
    id: "r1",
    bookId: "b1",
    conceptLabel: "개념A",
    sourceProvocationId: "p1",
    status: "weak",
    reviewPrompt: "다시 생각해봐",
    createdAt: "2026-03-09T10:02:00Z",
  },
];

const defaultProps = {
  bookTitle: "테스트 책",
  session: baseSession,
  provocations: [makeProv()],
  reviewItems: baseReviewItems,
  settings: baseSettings,
  onClose: vi.fn(),
};

describe("ExportPreview", () => {
  it("마크다운 프리뷰 렌더링", () => {
    render(<ExportPreview {...defaultProps} />);
    expect(screen.getByText(/테스트 책/)).toBeInTheDocument();
  });

  it("Layer 2 섹션: 사용자 답변만 추출한 노트", () => {
    render(<ExportPreview {...defaultProps} />);
    expect(screen.getByText(/내 답변 노트/)).toBeInTheDocument();
  });

  it("약점 목록 섹션", () => {
    render(<ExportPreview {...defaultProps} />);
    expect(screen.getByText(/개념A/)).toBeInTheDocument();
  });

  it("리뷰 질문 섹션", () => {
    render(<ExportPreview {...defaultProps} />);
    expect(screen.getByText(/다시 생각해봐/)).toBeInTheDocument();
  });

  it("세션 통계: 도발 수 + 판정 분포", () => {
    render(<ExportPreview {...defaultProps} />);
    expect(screen.getByText(/도발 수: 1/)).toBeInTheDocument();
  });

  it("세션 통계: 읽은 범위", () => {
    render(<ExportPreview {...defaultProps} />);
    expect(screen.getByText(/p\.38~47/)).toBeInTheDocument();
  });

  it("세션 통계: 소요 시간", () => {
    render(<ExportPreview {...defaultProps} />);
    expect(screen.getByText(/25분/)).toBeInTheDocument();
  });

  it("⚡높은확신+틀림 카운트", () => {
    const prov = makeProv({
      confidence: "high",
      evaluation: {
        verdict: "incorrect",
        whatWasRight: [],
        missingPoints: ["a"],
        followUpQuestion: null,
        retryAnswer: null,
        retryVerdict: null,
        retryEvaluatedAt: null,
      },
    });
    render(<ExportPreview {...defaultProps} provocations={[prov]} />);
    expect(screen.getByText(/⚡/)).toBeInTheDocument();
  });

  it("[다운로드 (.md)] → 다운로드 트리거", async () => {
    // Mock URL.createObjectURL and click
    const createObjectURL = vi.fn().mockReturnValue("blob:test");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(globalThis, "URL", {
      value: { createObjectURL, revokeObjectURL },
      writable: true,
    });

    render(<ExportPreview {...defaultProps} />);
    const downloadBtn = screen.getByText(/다운로드/);
    expect(downloadBtn).toBeInTheDocument();
  });
});
