import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModelAnswerCard } from "../../src/components/ModelAnswerCard";

afterEach(cleanup);

describe("ModelAnswerCard", () => {
  it("모범 답안 텍스트 표시", () => {
    render(<ModelAnswerCard modelAnswer="모범 답안 내용입니다." onSave={vi.fn()} />);
    expect(screen.getByText("모범 답안 내용입니다.")).toBeInTheDocument();
  });

  it("로딩 상태 표시 (모범 답안 생성 중)", () => {
    render(<ModelAnswerCard modelAnswer={null} onSave={vi.fn()} />);
    expect(screen.getByText(/모범 답안 생성 중/)).toBeInTheDocument();
  });

  it("[저장하고 넘어가기] 버튼 → onSave() 콜백", async () => {
    const onSave = vi.fn();
    render(<ModelAnswerCard modelAnswer="답안" onSave={onSave} />);
    await userEvent.click(screen.getByText("저장하고 넘어가기"));
    expect(onSave).toHaveBeenCalled();
  });
});
