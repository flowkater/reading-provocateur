import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvaluationCard } from "../../src/components/EvaluationCard";
import type { Provocation } from "../../src/types";

afterEach(cleanup);

function makeProvWithEval(
  verdict: "correct" | "partial" | "incorrect" | "memorized",
  overrides: Partial<Provocation> = {}
): Provocation {
  return {
    id: "p1",
    bookId: "b1",
    annotationId: null,
    pageNumber: 42,
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
      verdict,
      whatWasRight: verdict === "correct" ? ["맞음"] : ["일부"],
      missingPoints: verdict === "correct" ? [] : ["빠진점"],
      followUpQuestion: verdict === "correct" ? null : "후속 질문?",
      retryAnswer: null,
      retryVerdict: null,
      retryEvaluatedAt: null,
    },
    modelAnswer: null,
    ...overrides,
  };
}

describe("EvaluationCard", () => {
  const defaultActions = {
    onRetry: vi.fn(),
    onSkip: vi.fn(),
    onShowAnswer: vi.fn(),
  };

  it("verdict 배지 렌더링", () => {
    render(
      <EvaluationCard
        provocation={makeProvWithEval("correct")}
        {...defaultActions}
      />
    );
    expect(screen.getByText(/correct/i)).toBeInTheDocument();
    expect(screen.getByText(/✅/)).toBeInTheDocument();
  });

  it("verdict=correct → [저장] primary CTA만 표시", () => {
    render(
      <EvaluationCard
        provocation={makeProvWithEval("correct")}
        {...defaultActions}
      />
    );
    expect(screen.getByText("저장")).toBeInTheDocument();
    expect(screen.queryByText("다시 답변")).not.toBeInTheDocument();
  });

  it("verdict=partial → [다시 답변] + [저장하고 넘어가기] + [정답 보기]", () => {
    render(
      <EvaluationCard
        provocation={makeProvWithEval("partial")}
        {...defaultActions}
      />
    );
    expect(screen.getByText("다시 답변")).toBeInTheDocument();
    expect(screen.getByText("저장하고 넘어가기")).toBeInTheDocument();
    expect(screen.getByText("정답 보기")).toBeInTheDocument();
  });

  it("verdict=incorrect → [다시 답변] + [저장하고 넘어가기] + [정답 보기]", () => {
    render(
      <EvaluationCard
        provocation={makeProvWithEval("incorrect")}
        {...defaultActions}
      />
    );
    expect(screen.getByText("다시 답변")).toBeInTheDocument();
    expect(screen.getByText("저장하고 넘어가기")).toBeInTheDocument();
    expect(screen.getByText("정답 보기")).toBeInTheDocument();
  });

  it("verdict=memorized → [다시 답변] + [저장하고 넘어가기] + [정답 보기]", () => {
    render(
      <EvaluationCard
        provocation={makeProvWithEval("memorized")}
        {...defaultActions}
      />
    );
    expect(screen.getByText("다시 답변")).toBeInTheDocument();
    expect(screen.getByText("정답 보기")).toBeInTheDocument();
  });

  it("whatWasRight 목록 표시", () => {
    render(
      <EvaluationCard
        provocation={makeProvWithEval("partial")}
        {...defaultActions}
      />
    );
    expect(screen.getByText("일부")).toBeInTheDocument();
  });

  it("missingPoints 목록 표시", () => {
    render(
      <EvaluationCard
        provocation={makeProvWithEval("partial")}
        {...defaultActions}
      />
    );
    expect(screen.getByText("빠진점")).toBeInTheDocument();
  });

  it("followUpQuestion 표시", () => {
    render(
      <EvaluationCard
        provocation={makeProvWithEval("partial")}
        {...defaultActions}
      />
    );
    expect(screen.getByText("후속 질문?")).toBeInTheDocument();
  });

  it("재답변 textarea 렌더링", () => {
    render(
      <EvaluationCard
        provocation={makeProvWithEval("partial")}
        {...defaultActions}
      />
    );
    expect(screen.getByPlaceholderText(/다시 답변/)).toBeInTheDocument();
  });

  it("[다시 답변] → onRetry(retryAnswer)", async () => {
    const onRetry = vi.fn();
    render(
      <EvaluationCard
        provocation={makeProvWithEval("partial")}
        {...defaultActions}
        onRetry={onRetry}
      />
    );
    await userEvent.type(screen.getByPlaceholderText(/다시 답변/), "재답변 내용");
    await userEvent.click(screen.getByText("다시 답변"));
    expect(onRetry).toHaveBeenCalledWith("재답변 내용");
  });

  it("[저장하고 넘어가기] → onSkip()", async () => {
    const onSkip = vi.fn();
    render(
      <EvaluationCard
        provocation={makeProvWithEval("partial")}
        {...defaultActions}
        onSkip={onSkip}
      />
    );
    await userEvent.click(screen.getByText("저장하고 넘어가기"));
    expect(onSkip).toHaveBeenCalled();
  });

  it("[정답 보기] → onShowAnswer()", async () => {
    const onShowAnswer = vi.fn();
    render(
      <EvaluationCard
        provocation={makeProvWithEval("partial")}
        {...defaultActions}
        onShowAnswer={onShowAnswer}
      />
    );
    await userEvent.click(screen.getByText("정답 보기"));
    expect(onShowAnswer).toHaveBeenCalled();
  });

  it("재시도 후: 1차 verdict + 재시도 verdict 표시", () => {
    const prov = makeProvWithEval("partial", {
      evaluation: {
        verdict: "partial",
        whatWasRight: ["일부"],
        missingPoints: ["빠진점"],
        followUpQuestion: "후속?",
        retryAnswer: "재시도 답변",
        retryVerdict: "correct",
        retryEvaluatedAt: new Date().toISOString(),
      },
    });
    render(<EvaluationCard provocation={prov} {...defaultActions} />);
    // Both verdicts should be visible
    expect(screen.getAllByText(/partial|correct/i).length).toBeGreaterThanOrEqual(2);
  });
});
