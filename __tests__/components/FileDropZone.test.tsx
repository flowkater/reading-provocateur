import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileDropZone } from "../../src/components/FileDropZone";

afterEach(cleanup);

describe("FileDropZone", () => {
  const defaultProps = {
    onFileSelect: vi.fn(),
    onSampleClick: vi.fn(),
  };

  it("드래그앤드롭 영역 렌더링", () => {
    render(<FileDropZone {...defaultProps} />);
    expect(screen.getByText("PDF를 여기에 드롭")).toBeInTheDocument();
    expect(screen.getByText("또는 클릭하여 파일 선택")).toBeInTheDocument();
  });

  it("파일 드롭 → onFileSelect 호출", () => {
    const onFileSelect = vi.fn();
    render(<FileDropZone {...defaultProps} onFileSelect={onFileSelect} />);

    const dropZone = screen.getByText("PDF를 여기에 드롭").closest("div")!;
    const file = new File(["pdf"], "test.pdf", { type: "application/pdf" });

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("샘플 버튼 → onSampleClick 호출", async () => {
    const onSampleClick = vi.fn();
    render(<FileDropZone {...defaultProps} onSampleClick={onSampleClick} />);

    await userEvent.click(screen.getByText("샘플로 체험하기"));
    expect(onSampleClick).toHaveBeenCalledOnce();
  });
});
