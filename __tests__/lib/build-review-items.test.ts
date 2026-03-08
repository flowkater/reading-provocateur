import { describe, it, expect } from "vitest";
import { buildReviewItem } from "../../src/lib/build-review-items";
import type { Provocation } from "../../src/types";

function makeProv(overrides: Partial<Provocation> = {}): Provocation {
  return {
    id: "p1",
    bookId: "b1",
    annotationId: null,
    pageNumber: 10,
    selectedText: "text",
    contextExcerpt: "context",
    sessionMode: "understand",
    intent: "core",
    kind: "recall",
    question: "질문?",
    answer: "답변",
    confidence: "high",
    createdAt: new Date().toISOString(),
    answeredAt: new Date().toISOString(),
    evaluation: {
      verdict: "correct",
      whatWasRight: ["맞음"],
      missingPoints: [],
      followUpQuestion: null,
      retryAnswer: null,
      retryVerdict: null,
      retryEvaluatedAt: null,
    },
    modelAnswer: null,
    ...overrides,
  };
}

describe("buildReviewItem", () => {
  it("verdict=correct → ReviewItem 미생성", () => {
    const result = buildReviewItem(makeProv());
    expect(result).toBeNull();
  });

  it("verdict=partial → ReviewItem 1개 (status=weak)", () => {
    const prov = makeProv({
      evaluation: {
        verdict: "partial",
        whatWasRight: ["일부"],
        missingPoints: ["빠진점"],
        followUpQuestion: "후속?",
        retryAnswer: null,
        retryVerdict: null,
        retryEvaluatedAt: null,
      },
    });
    const result = buildReviewItem(prov);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("weak");
  });

  it("verdict=incorrect → ReviewItem 1개 (status=weak)", () => {
    const prov = makeProv({
      evaluation: {
        verdict: "incorrect",
        whatWasRight: [],
        missingPoints: ["핵심 누락"],
        followUpQuestion: "다시",
        retryAnswer: null,
        retryVerdict: null,
        retryEvaluatedAt: null,
      },
    });
    const result = buildReviewItem(prov);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("weak");
  });

  it("verdict=memorized → ReviewItem 1개 (status=weak)", () => {
    const prov = makeProv({
      evaluation: {
        verdict: "memorized",
        whatWasRight: ["단어"],
        missingPoints: ["이해 부족"],
        followUpQuestion: "자기 말로",
        retryAnswer: null,
        retryVerdict: null,
        retryEvaluatedAt: null,
      },
    });
    const result = buildReviewItem(prov);
    expect(result!.status).toBe("weak");
  });

  it("verdict=correct + confidence=low → ReviewItem (pending-review)", () => {
    const prov = makeProv({ confidence: "low" });
    const result = buildReviewItem(prov);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("pending-review");
  });

  it("verdict=correct + confidence=high → ReviewItem 미생성", () => {
    const prov = makeProv({ confidence: "high" });
    const result = buildReviewItem(prov);
    expect(result).toBeNull();
  });

  it("conceptLabel이 missingPoints[0]에서 추출", () => {
    const prov = makeProv({
      evaluation: {
        verdict: "partial",
        whatWasRight: [],
        missingPoints: ["DI 개념 이해", "SOLID 원칙"],
        followUpQuestion: null,
        retryAnswer: null,
        retryVerdict: null,
        retryEvaluatedAt: null,
      },
    });
    const result = buildReviewItem(prov);
    expect(result!.conceptLabel).toBe("DI 개념 이해");
  });

  it("reviewPrompt에 빈틈 포인트 반영", () => {
    const prov = makeProv({
      evaluation: {
        verdict: "incorrect",
        whatWasRight: [],
        missingPoints: ["핵심 누락"],
        followUpQuestion: "다시 생각",
        retryAnswer: null,
        retryVerdict: null,
        retryEvaluatedAt: null,
      },
    });
    const result = buildReviewItem(prov);
    expect(result!.reviewPrompt).toContain("핵심 누락");
  });
});
