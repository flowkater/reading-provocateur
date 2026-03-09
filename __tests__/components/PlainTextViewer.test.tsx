import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockSelection } from "../../src/__test__/selection-mock";
import { PlainTextViewer } from "../../src/components/PlainTextViewer";
import type { Annotation, PlainTextDocument } from "../../src/types";

afterEach(cleanup);

const textDoc: PlainTextDocument = {
  id: "text-1",
  title: "붙여넣은 텍스트",
  content: "첫 문장입니다.\n둘째 문장입니다.",
  charCount: 16,
  addedAt: "2026-03-09T00:00:00.000Z",
};

const textAnnotation: Annotation = {
  id: "ann-1",
  bookId: "text-1",
  contentType: "text",
  pageNumber: 1,
  selectedText: "둘째 문장",
  quote: "둘째 문장",
  contextBefore: "",
  contextAfter: "입니다.",
  intent: null,
  createdAt: "2026-03-09T00:00:00.000Z",
};

describe("PlainTextViewer", () => {
  it("plain text 본문을 렌더링", () => {
    render(
      <PlainTextViewer
        document={textDoc}
        onTextSelect={vi.fn()}
        annotations={[]}
      />
    );

    expect(screen.getByText(/첫 문장입니다\./)).toBeInTheDocument();
    expect(screen.getByText(/둘째 문장입니다\./)).toBeInTheDocument();
  });

  it("텍스트 선택 → onTextSelect 콜백", () => {
    const onTextSelect = vi.fn();
    const { container } = render(
      <PlainTextViewer
        document={textDoc}
        onTextSelect={onTextSelect}
        annotations={[]}
      />
    );

    mockSelection("둘째 문장", { left: 120, bottom: 220 });
    fireEvent.mouseUp(container.firstChild!);

    expect(onTextSelect).toHaveBeenCalledWith(
      "둘째 문장",
      { x: 120, y: 220 },
      expect.objectContaining({
        contentType: "text",
        quote: "둘째 문장",
      })
    );
  });

  it("text annotation이 있으면 mark highlight를 복원", () => {
    const { container } = render(
      <PlainTextViewer
        document={textDoc}
        onTextSelect={vi.fn()}
        annotations={[textAnnotation]}
      />
    );

    expect(container.querySelector("mark.highlight-yellow")).toBeInTheDocument();
  });

  it("편집 버튼 → textarea 전환 → 저장 콜백", async () => {
    const onSave = vi.fn();
    render(
      <PlainTextViewer
        document={textDoc}
        onTextSelect={vi.fn()}
        annotations={[]}
        onSave={onSave}
      />
    );

    await userEvent.click(screen.getByText("편집"));
    const titleInput = screen.getByDisplayValue("붙여넣은 텍스트");
    const textarea = screen.getAllByRole("textbox")[1];

    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "수정된 제목");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "새 본문");
    await userEvent.click(screen.getByText("저장"));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining<Partial<PlainTextDocument>>({
        title: "수정된 제목",
        content: "새 본문",
      })
    );
  });
});
