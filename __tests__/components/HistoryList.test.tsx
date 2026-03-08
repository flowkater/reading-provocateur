import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryList } from "../../src/components/HistoryList";
import type { Provocation } from "../../src/types";

afterEach(cleanup);

const makeProv = (id: string, page: number): Provocation => ({
  id,
  bookId: "b1",
  annotationId: null,
  pageNumber: page,
  selectedText: "text",
  contextExcerpt: "context",
  sessionMode: "understand",
  intent: "core",
  kind: "recall",
  question: `질문 ${id}`,
  answer: "답변",
  confidence: "high",
  createdAt: new Date().toISOString(),
  answeredAt: new Date().toISOString(),
  evaluation: {
    verdict: "partial",
    whatWasRight: [],
    missingPoints: [],
    followUpQuestion: null,
    retryAnswer: null,
    retryVerdict: null,
    retryEvaluatedAt: null,
  },
  modelAnswer: null,
});

describe("HistoryList", () => {
  it("이전 도발 미니 카드 목록 렌더링", () => {
    render(
      <HistoryList
        history={[makeProv("p1", 10), makeProv("p2", 20)]}
        onPageJump={vi.fn()}
      />
    );
    expect(screen.getByText(/질문 p1/)).toBeInTheDocument();
    expect(screen.getByText(/질문 p2/)).toBeInTheDocument();
  });

  it("빈 목록 → 미표시", () => {
    const { container } = render(
      <HistoryList history={[]} onPageJump={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("카드 클릭 → onPageJump(pageNumber) 콜백", async () => {
    const onPageJump = vi.fn();
    render(
      <HistoryList history={[makeProv("p1", 42)]} onPageJump={onPageJump} />
    );
    await userEvent.click(screen.getByText(/질문 p1/));
    expect(onPageJump).toHaveBeenCalledWith(42);
  });

  it("최신 도발이 상단에 위치 (역순)", () => {
    render(
      <HistoryList
        history={[makeProv("p1", 10), makeProv("p2", 20)]}
        onPageJump={vi.fn()}
      />
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[0].textContent).toContain("질문 p2");
    expect(buttons[1].textContent).toContain("질문 p1");
  });

  it("Newsprint 미니 카드 스타일: border-neutral-300, hover:border-[#111]", () => {
    render(
      <HistoryList history={[makeProv("p1", 10)]} onPageJump={vi.fn()} />
    );
    const card = screen.getByText(/질문 p1/).closest("button");
    expect(card).toHaveClass("border-neutral-300");
    expect(card).toHaveClass("hover:border-[#111]");
  });
});
