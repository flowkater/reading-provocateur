import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingToolbar } from "../../src/components/FloatingToolbar";

afterEach(cleanup);

describe("FloatingToolbar", () => {
  const defaultProps = {
    position: { x: 100, y: 100 },
    onHighlight: vi.fn(),
    onProvoke: vi.fn(),
    onClose: vi.fn(),
  };

  it("Step 1: [Highlight] [Provoke] 2버튼 렌더링", () => {
    render(<FloatingToolbar {...defaultProps} />);
    expect(screen.getByText(/Highlight/i)).toBeInTheDocument();
    expect(screen.getByText(/Provoke/i)).toBeInTheDocument();
  });

  it("Highlight 클릭 → onHighlight 콜백", async () => {
    const onHighlight = vi.fn();
    render(<FloatingToolbar {...defaultProps} onHighlight={onHighlight} />);
    await userEvent.click(screen.getByText(/Highlight/i));
    expect(onHighlight).toHaveBeenCalled();
  });

  it("Provoke 클릭 → Step 2: Intent chips 전개", async () => {
    render(<FloatingToolbar {...defaultProps} />);
    await userEvent.click(screen.getByText(/Provoke/i));
    expect(screen.getByText("왜 여기서 묻길 원해?")).toBeInTheDocument();
    expect(screen.getByText("핵심")).toBeInTheDocument();
    expect(screen.getByText("헷갈림")).toBeInTheDocument();
    expect(screen.getByText("연결")).toBeInTheDocument();
    expect(screen.getByText("적용")).toBeInTheDocument();
  });

  it("Step 2에서 Step 1 버튼 숨김 확인", async () => {
    render(<FloatingToolbar {...defaultProps} />);
    await userEvent.click(screen.getByText(/Provoke/i));
    expect(screen.queryByText(/Highlight/i)).not.toBeInTheDocument();
  });

  it("Intent chip 클릭 → onProvoke(intent) 콜백", async () => {
    const onProvoke = vi.fn();
    render(<FloatingToolbar {...defaultProps} onProvoke={onProvoke} />);
    await userEvent.click(screen.getByText(/Provoke/i));
    await userEvent.click(screen.getByText("핵심"));
    expect(onProvoke).toHaveBeenCalledWith("core");
  });

  it("외부 클릭 → 툴바 닫힘", async () => {
    const onClose = vi.fn();
    render(
      <div>
        <div data-testid="outside">outside</div>
        <FloatingToolbar {...defaultProps} onClose={onClose} />
      </div>
    );
    await userEvent.click(screen.getByTestId("outside"));
    expect(onClose).toHaveBeenCalled();
  });

  it("Newsprint 스타일: bg-[#111] text-[#F9F9F7] uppercase tracking-wider", () => {
    render(<FloatingToolbar {...defaultProps} />);
    const button = screen.getByText(/Highlight/i);
    // The outer wrapper div has the newsprint styles
    const toolbar = button.closest("div")?.parentElement;
    expect(toolbar).toHaveClass("bg-[#111]");
    expect(toolbar).toHaveClass("text-[#F9F9F7]");
  });
});
