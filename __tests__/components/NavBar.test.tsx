import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavBar } from "../../src/components/NavBar";

afterEach(cleanup);

describe("NavBar", () => {
  const defaultProps = {
    bookTitle: "소프트웨어 장인",
    mode: "understand" as const,
    currentPage: 42,
    onSettingsClick: vi.fn(),
    onExportClick: vi.fn(),
  };

  it("책 제목 렌더링", () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByText("소프트웨어 장인")).toBeInTheDocument();
  });

  it("페이지 번호 표시", () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByText("p.42")).toBeInTheDocument();
  });

  it("Settings 버튼 클릭 → onSettingsClick 호출", async () => {
    const onSettingsClick = vi.fn();
    render(<NavBar {...defaultProps} onSettingsClick={onSettingsClick} />);
    await userEvent.click(screen.getByText("Settings"));
    expect(onSettingsClick).toHaveBeenCalledOnce();
  });
});
