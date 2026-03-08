import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProvocationCard } from "../../src/components/ProvocationCard";
import type { Provocation } from "../../src/types";

afterEach(cleanup);

const baseProv: Provocation = {
  id: "p1",
  bookId: "b1",
  annotationId: null,
  pageNumber: 42,
  selectedText: "TDD 텍스트",
  contextExcerpt: "context",
  sessionMode: "understand",
  intent: "core",
  kind: "misconception",
  question: "정말 TDD를 이해하고 있어?",
  answer: null,
  confidence: null,
  createdAt: new Date().toISOString(),
  answeredAt: null,
  evaluation: null,
  modelAnswer: null,
};

describe("ProvocationCard", () => {
  it("질문 표시: kind 라벨 + mode + intent", () => {
    render(<ProvocationCard provocation={baseProv} onSubmit={vi.fn()} />);
    expect(screen.getByText(/misconception/i)).toBeInTheDocument();
    expect(screen.getByText(/정말 TDD를 이해하고 있어/)).toBeInTheDocument();
  });

  it("페이지 번호 + 하이라이트 텍스트 표시", () => {
    render(<ProvocationCard provocation={baseProv} onSubmit={vi.fn()} />);
    expect(screen.getByText(/p\.42/)).toBeInTheDocument();
    expect(screen.getByText(/TDD 텍스트/)).toBeInTheDocument();
  });

  it("답변 textarea 렌더링", () => {
    render(<ProvocationCard provocation={baseProv} onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText(/답변/)).toBeInTheDocument();
  });

  it("확신도 3칩 (낮음, 중간, 높음) 렌더링", () => {
    render(<ProvocationCard provocation={baseProv} onSubmit={vi.fn()} />);
    expect(screen.getByText("낮음")).toBeInTheDocument();
    expect(screen.getByText("중간")).toBeInTheDocument();
    expect(screen.getByText("높음")).toBeInTheDocument();
  });

  it("확신도 선택 → 칩 반전 스타일", async () => {
    render(<ProvocationCard provocation={baseProv} onSubmit={vi.fn()} />);
    const highBtn = screen.getByText("높음");
    await userEvent.click(highBtn);
    expect(highBtn).toHaveClass("bg-[#111]");
    expect(highBtn).toHaveClass("text-[#F9F9F7]");
  });

  it("답변 비어있으면 [제출] disabled", () => {
    render(<ProvocationCard provocation={baseProv} onSubmit={vi.fn()} />);
    const submit = screen.getByText("제출");
    expect(submit).toBeDisabled();
  });

  it("확신도 미선택이면 [제출] disabled", async () => {
    render(<ProvocationCard provocation={baseProv} onSubmit={vi.fn()} />);
    const textarea = screen.getByPlaceholderText(/답변/);
    await userEvent.type(textarea, "내 답변");
    const submit = screen.getByText("제출");
    expect(submit).toBeDisabled();
  });

  it("답변 + 확신도 있으면 [제출] enabled", async () => {
    render(<ProvocationCard provocation={baseProv} onSubmit={vi.fn()} />);
    const textarea = screen.getByPlaceholderText(/답변/);
    await userEvent.type(textarea, "내 답변");
    await userEvent.click(screen.getByText("높음"));
    const submit = screen.getByText("제출");
    expect(submit).not.toBeDisabled();
  });

  it("[제출] 클릭 → onSubmit(answer, confidence)", async () => {
    const onSubmit = vi.fn();
    render(<ProvocationCard provocation={baseProv} onSubmit={onSubmit} />);
    const textarea = screen.getByPlaceholderText(/답변/);
    await userEvent.type(textarea, "내 답변");
    await userEvent.click(screen.getByText("높음"));
    await userEvent.click(screen.getByText("제출"));
    expect(onSubmit).toHaveBeenCalledWith("내 답변", "high");
  });
});
