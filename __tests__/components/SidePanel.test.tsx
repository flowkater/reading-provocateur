import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidePanel } from "../../src/components/SidePanel";
import type { Provocation, SidePanelState } from "../../src/types";

afterEach(cleanup);

const baseProv: Provocation = {
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
  answer: null,
  confidence: null,
  createdAt: new Date().toISOString(),
  answeredAt: null,
  evaluation: null,
  modelAnswer: null,
};

const answeredProv: Provocation = {
  ...baseProv,
  answer: "답변",
  confidence: "high",
  evaluation: {
    verdict: "partial",
    whatWasRight: ["일부"],
    missingPoints: ["빠진점"],
    followUpQuestion: "후속?",
    retryAnswer: null,
    retryVerdict: null,
    retryEvaluatedAt: null,
  },
};

const defaultProps = {
  state: "empty" as SidePanelState,
  provocation: null as Provocation | null,
  history: [] as Provocation[],
  modelAnswer: null as string | null,
  error: null as string | null,
  hasApiKey: true,
  onProvoke: vi.fn(),
  onSubmitAnswer: vi.fn(),
  onRetry: vi.fn(),
  onSkip: vi.fn(),
  onShowAnswer: vi.fn(),
  onSave: vi.fn(),
  onPageJump: vi.fn(),
  onOpenSettings: vi.fn(),
};

describe("SidePanel", () => {
  it("state=empty → EmptyState 렌더링", () => {
    render(<SidePanel {...defaultProps} state="empty" />);
    expect(screen.getByText(/텍스트를 선택하거나/)).toBeInTheDocument();
  });

  it("state=loading → LoadingCard 렌더링", () => {
    render(<SidePanel {...defaultProps} state="loading" />);
    expect(screen.getByText(/생각 중/)).toBeInTheDocument();
  });

  it("state=question → ProvocationCard 렌더링", () => {
    render(
      <SidePanel {...defaultProps} state="question" provocation={baseProv} />
    );
    expect(screen.getByText("질문?")).toBeInTheDocument();
  });

  it("state=evaluating → LoadingCard 렌더링", () => {
    render(<SidePanel {...defaultProps} state="evaluating" />);
    expect(screen.getByText(/평가 중/)).toBeInTheDocument();
  });

  it("state=evaluation → EvaluationCard 렌더링", () => {
    render(
      <SidePanel
        {...defaultProps}
        state="evaluation"
        provocation={answeredProv}
      />
    );
    expect(screen.getByText(/partial/i)).toBeInTheDocument();
  });

  it("state=modelAnswer → ModelAnswerCard 렌더링", () => {
    render(
      <SidePanel
        {...defaultProps}
        state="modelAnswer"
        provocation={{ ...answeredProv, modelAnswer: "모범 답안 내용" }}
        modelAnswer="모범 답안 내용"
      />
    );
    expect(screen.getByText("모범 답안 내용")).toBeInTheDocument();
  });

  it("state=saved → 히스토리에 카드 표시", () => {
    render(
      <SidePanel
        {...defaultProps}
        state="saved"
        history={[answeredProv]}
      />
    );
    expect(screen.getByText(/p\.42/)).toBeInTheDocument();
  });

  it("[도발해줘] 버튼 state=empty에서 표시 (하단 고정)", () => {
    render(<SidePanel {...defaultProps} state="empty" />);
    const buttons = screen.getAllByRole("button");
    const provokeBtn = buttons.find((b) => b.textContent?.includes("도발해줘"));
    expect(provokeBtn).toBeDefined();
  });

  it("[도발해줘] 클릭 → Intent chips 표시", async () => {
    render(<SidePanel {...defaultProps} state="empty" />);
    const buttons = screen.getAllByRole("button");
    const provokeBtn = buttons.find((b) => b.textContent?.includes("도발해줘"))!;
    await userEvent.click(provokeBtn);
    expect(screen.getByText("핵심")).toBeInTheDocument();
    expect(screen.getByText("헷갈림")).toBeInTheDocument();
  });

  it("[도발해줘] 버튼 state=saved에서도 표시", () => {
    render(
      <SidePanel {...defaultProps} state="saved" history={[answeredProv]} />
    );
    const buttons = screen.getAllByRole("button");
    const provokeBtn = buttons.find((b) => b.textContent?.includes("도발해줘"));
    expect(provokeBtn).toBeDefined();
  });

  it("API Key 없으면 Settings Dialog 자동 오픈", () => {
    const onOpenSettings = vi.fn();
    render(
      <SidePanel {...defaultProps} hasApiKey={false} onOpenSettings={onOpenSettings} />
    );
    const buttons = screen.getAllByRole("button");
    const provokeBtn = buttons.find((b) => b.textContent?.includes("도발해줘"))!;
    provokeBtn.click();
    expect(onOpenSettings).toHaveBeenCalled();
  });
});
