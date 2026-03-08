import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionModeSelector } from "../../src/components/SessionModeSelector";

afterEach(cleanup);

describe("SessionModeSelector", () => {
  const defaultProps = {
    selected: null as string | null,
    onSelect: vi.fn(),
    onSampleClick: vi.fn(),
  };

  it("4개 모드 카드 렌더링 (이해, 적용, 시험, 비판)", () => {
    render(<SessionModeSelector {...defaultProps} />);
    expect(screen.getByText("이해")).toBeInTheDocument();
    expect(screen.getByText("적용")).toBeInTheDocument();
    expect(screen.getByText("시험")).toBeInTheDocument();
    expect(screen.getByText("비판")).toBeInTheDocument();
  });

  it("각 카드에 질문 종류 힌트 표시", () => {
    render(<SessionModeSelector {...defaultProps} />);
    expect(screen.getAllByText(/recall/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/transfer/i)).toBeInTheDocument();
  });

  it("모드 클릭 → onSelect 콜백 호출", async () => {
    const onSelect = vi.fn();
    render(<SessionModeSelector {...defaultProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByText("이해"));
    expect(onSelect).toHaveBeenCalledWith("understand");
  });

  it("선택된 모드: 반전 스타일", () => {
    render(<SessionModeSelector {...defaultProps} selected="understand" />);
    const card = screen.getByText("이해").closest("button");
    expect(card).toHaveClass("bg-[#111]");
    expect(card).toHaveClass("text-[#F9F9F7]");
  });

  it("미선택: 기본 스타일", () => {
    render(<SessionModeSelector {...defaultProps} selected="understand" />);
    const card = screen.getByText("적용").closest("button");
    expect(card).toHaveClass("bg-[#F9F9F7]");
    expect(card).toHaveClass("border-[#111]");
  });

  it("[샘플로 체험하기] 클릭 → onSampleClick 콜백", async () => {
    const onSampleClick = vi.fn();
    render(<SessionModeSelector {...defaultProps} onSampleClick={onSampleClick} />);
    await userEvent.click(screen.getByText(/샘플로 체험하기/));
    expect(onSampleClick).toHaveBeenCalled();
  });
});
