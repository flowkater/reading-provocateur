import { describe, it, expect } from "vitest";
import { generateExportMarkdown } from "../../src/lib/export";
import type { Provocation, ReviewItem, SessionContext, Settings } from "../../src/types";

function makeProv(overrides: Partial<Provocation> = {}): Provocation {
  return {
    id: "p1",
    bookId: "b1",
    annotationId: null,
    pageNumber: 38,
    selectedText: "TDD text",
    contextExcerpt: "context",
    sessionMode: "understand",
    intent: "core",
    kind: "recall",
    question: "TDD란 무엇인가?",
    answer: "테스트 먼저 작성하는 방법",
    confidence: "high",
    createdAt: "2026-03-09T10:00:00Z",
    answeredAt: "2026-03-09T10:01:00Z",
    evaluation: {
      verdict: "partial",
      whatWasRight: ["기본 이해"],
      missingPoints: ["Red-Green-Refactor 사이클"],
      followUpQuestion: "사이클 설명해봐",
      retryAnswer: "Red-Green-Refactor로 동작",
      retryVerdict: "correct",
      retryEvaluatedAt: "2026-03-09T10:02:00Z",
    },
    modelAnswer: null,
    ...overrides,
  };
}

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
  apiKey: "sk-test",
  rememberKey: false,
  model: "claude-sonnet-4-6",
  defaultMode: "understand",
  obsidianFrontmatter: false,
};

const baseReviewItems: ReviewItem[] = [
  {
    id: "r1",
    bookId: "b1",
    conceptLabel: "Red-Green-Refactor",
    sourceProvocationId: "p1",
    status: "weak",
    reviewPrompt: "사이클 다시 설명해봐",
    createdAt: "2026-03-09T10:02:00Z",
  },
];

describe("generateExportMarkdown", () => {
  it("기본 Export: 제목 + 모드 + 날짜", () => {
    const md = generateExportMarkdown({
      bookTitle: "소프트웨어 장인",
      session: baseSession,
      provocations: [makeProv()],
      reviewItems: [],
      settings: baseSettings,
    });
    expect(md).toContain("소프트웨어 장인");
    expect(md).toContain("understand");
    expect(md).toContain("2026-03-09");
  });

  it("도발 카드: 페이지, kind, intent, 질문, 답변, 확신도", () => {
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: [makeProv()],
      reviewItems: [],
      settings: baseSettings,
    });
    expect(md).toContain("p.38");
    expect(md).toContain("recall");
    expect(md).toContain("core");
    expect(md).toContain("TDD란 무엇인가?");
    expect(md).toContain("테스트 먼저 작성하는 방법");
    expect(md).toContain("high");
  });

  it("평가: verdict 배지 + 빠진 점", () => {
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: [makeProv()],
      reviewItems: [],
      settings: baseSettings,
    });
    expect(md).toContain("partial");
    expect(md).toContain("Red-Green-Refactor 사이클");
  });

  it("재시도: retryAnswer + retryVerdict 포함", () => {
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: [makeProv()],
      reviewItems: [],
      settings: baseSettings,
    });
    expect(md).toContain("Red-Green-Refactor로 동작");
    expect(md).toContain("correct");
  });

  it("모범 답안: modelAnswer 있으면 별도 섹션", () => {
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: [makeProv({ modelAnswer: "모범 답안 내용" })],
      reviewItems: [],
      settings: baseSettings,
    });
    expect(md).toContain("모범 답안 내용");
  });

  it("Layer 2 섹션: 사용자 답변만 추출한 노트", () => {
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: [makeProv()],
      reviewItems: [],
      settings: baseSettings,
    });
    expect(md).toContain("## 내 답변 노트");
    // Layer 2 should contain user answers but not AI questions
    const layer2Start = md.indexOf("## 내 답변 노트");
    const layer2End = md.indexOf("##", layer2Start + 1);
    const layer2 = md.slice(layer2Start, layer2End > -1 ? layer2End : undefined);
    expect(layer2).toContain("테스트 먼저 작성하는 방법");
  });

  it("약점 목록 섹션", () => {
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: [makeProv()],
      reviewItems: baseReviewItems,
      settings: baseSettings,
    });
    expect(md).toContain("Red-Green-Refactor");
    expect(md).toContain("weak");
  });

  it("리뷰 질문 섹션 (최대 5개)", () => {
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: [makeProv()],
      reviewItems: baseReviewItems,
      settings: baseSettings,
    });
    expect(md).toContain("사이클 다시 설명해봐");
  });

  it("세션 통계: 도발 수, 판정 분포, 확신도 분포, ⚡높은확신+틀림", () => {
    const provs = [
      makeProv({ id: "p1", confidence: "high" }),
      makeProv({
        id: "p2",
        confidence: "high",
        evaluation: {
          verdict: "incorrect",
          whatWasRight: [],
          missingPoints: ["a"],
          followUpQuestion: "q",
          retryAnswer: null,
          retryVerdict: null,
          retryEvaluatedAt: null,
        },
      }),
    ];
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: provs,
      reviewItems: [],
      settings: baseSettings,
    });
    expect(md).toContain("도발 수: 2");
    expect(md).toContain("⚡");
  });

  it("세션 통계: 읽은 범위 (firstPage~lastPage)", () => {
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: [makeProv()],
      reviewItems: [],
      settings: baseSettings,
    });
    expect(md).toContain("p.38~47");
  });

  it("세션 통계: 소요 시간", () => {
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: [makeProv()],
      reviewItems: [],
      settings: baseSettings,
    });
    expect(md).toContain("25분");
  });

  it("obsidianFrontmatter=true → YAML 프론트매터 포함", () => {
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: [makeProv()],
      reviewItems: [],
      settings: { ...baseSettings, obsidianFrontmatter: true },
    });
    expect(md.startsWith("---\n")).toBe(true);
    expect(md).toContain("tags:");
  });

  it("obsidianFrontmatter=false → 프론트매터 미포함", () => {
    const md = generateExportMarkdown({
      bookTitle: "책",
      session: baseSession,
      provocations: [makeProv()],
      reviewItems: [],
      settings: baseSettings,
    });
    expect(md.startsWith("---\n")).toBe(false);
  });

  it("빈 배열 → 유효한 마크다운 생성", () => {
    const md = generateExportMarkdown({
      bookTitle: "빈 책",
      session: baseSession,
      provocations: [],
      reviewItems: [],
      settings: baseSettings,
    });
    expect(md).toContain("# 📖 빈 책");
    expect(md).toContain("## 도발 기록");
    expect(md).toContain("도발 수: 0");
    // Should not contain weak concept sections
    expect(md).not.toContain("## 약점 목록");
  });

  it("plain text source → 텍스트 전용 export wording", () => {
    const md = generateExportMarkdown({
      bookTitle: "붙여넣은 텍스트",
      sourceType: "text",
      session: baseSession,
      provocations: [],
      reviewItems: [],
      settings: baseSettings,
    });

    expect(md).toContain("# 📝 붙여넣은 텍스트");
    expect(md).toContain("**소스:** 텍스트");
  });
});
