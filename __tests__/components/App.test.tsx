import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock ReadingView
vi.mock("../../src/components/ReadingView", () => ({
  ReadingView: ({
    mode,
    onModeChange,
  }: {
    mode: string;
    onModeChange: (mode: "understand" | "apply" | "exam" | "critique") => void;
  }) => (
    <div data-testid="reading-view" data-mode={mode}>
      <button onClick={() => onModeChange("exam")}>모드 변경</button>
    </div>
  ),
}));

import App from "../../src/App";

afterEach(cleanup);

beforeEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("App", () => {
  it("온보딩에서 모드 선택 → ReadingView 전환", async () => {
    render(<App />);
    // Should show onboarding
    expect(screen.getByText("Reading Provocateur")).toBeInTheDocument();

    // Click "이해" mode
    await userEvent.click(screen.getByText("이해"));

    // Should show ReadingView
    expect(screen.getByTestId("reading-view")).toBeInTheDocument();
    expect(screen.getByTestId("reading-view")).toHaveAttribute("data-mode", "understand");
  });

  it("샘플 클릭 → understand 모드로 ReadingView 전환", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("샘플로 체험하기"));
    expect(screen.getByTestId("reading-view")).toBeInTheDocument();
    expect(screen.getByTestId("reading-view")).toHaveAttribute("data-mode", "understand");
  });

  it("ReadingView에서 모드 변경 요청 → App mode 갱신", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("이해"));
    await userEvent.click(screen.getByText("모드 변경"));

    expect(screen.getByTestId("reading-view")).toHaveAttribute("data-mode", "exam");
  });
});
