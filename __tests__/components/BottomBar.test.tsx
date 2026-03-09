import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { BottomBar } from "../../src/components/BottomBar";

afterEach(cleanup);

describe("BottomBar", () => {
  it("현재 페이지 / 전체 페이지 표시", () => {
    render(<BottomBar currentPage={5} totalPages={20} />);
    expect(screen.getByText("p.5/20")).toBeInTheDocument();
  });

  it("진행률 표시", () => {
    render(<BottomBar currentPage={5} totalPages={20} />);
    expect(screen.getByText("25%")).toBeInTheDocument();
  });
});
