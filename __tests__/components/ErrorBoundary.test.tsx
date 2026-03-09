import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";

afterEach(cleanup);

// Use a module-level flag so the component picks up the updated value on re-render
let throwFlag = false;

function ThrowingChild() {
  if (throwFlag) throw new Error("렌더 에러 발생");
  return <div>정상 렌더링</div>;
}

describe("ErrorBoundary", () => {
  it("렌더 에러 시 fallback UI 표시", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    throwFlag = true;
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText("문제가 발생했습니다")).toBeInTheDocument();
    expect(screen.getByText("렌더 에러 발생")).toBeInTheDocument();

    throwFlag = false;
    spy.mockRestore();
  });

  it("다시 시도 버튼 클릭 → 복원", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    throwFlag = true;
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText("문제가 발생했습니다")).toBeInTheDocument();

    // Fix the error before clicking retry
    throwFlag = false;

    fireEvent.click(screen.getByText("다시 시도"));

    expect(screen.getByText("정상 렌더링")).toBeInTheDocument();

    spy.mockRestore();
  });
});
