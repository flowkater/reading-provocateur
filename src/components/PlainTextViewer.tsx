import { useCallback, useMemo, useState } from "react";
import type { Annotation, PlainTextDocument, SelectionData } from "../types";

interface PlainTextViewerProps {
  document: PlainTextDocument;
  onTextSelect: (
    text: string,
    position: { x: number; y: number },
    selectionData?: SelectionData
  ) => void;
  annotations?: Annotation[];
  onSave?: (doc: PlainTextDocument) => void;
}

function buildSelectionData(
  selectedText: string,
  text: string
): SelectionData {
  const index = text.indexOf(selectedText);
  const beforeStart = Math.max(0, index - 32);
  const afterEnd = Math.min(text.length, index + selectedText.length + 32);

  return {
    contentType: "text",
    pageNumber: 1,
    quote: selectedText,
    contextBefore: index >= 0 ? text.slice(beforeStart, index) : "",
    contextAfter:
      index >= 0 ? text.slice(index + selectedText.length, afterEnd) : "",
  };
}

function applyHighlights(text: string, annotations: Annotation[]): string {
  if (annotations.length === 0) return text;

  let result = text;
  for (const annotation of annotations) {
    const quote = annotation.quote ?? annotation.selectedText;
    if (!quote || !result.includes(quote)) continue;
    result = result.replace(
      quote,
      `<mark class="highlight-yellow">${quote}</mark>`
    );
  }
  return result.replace(/\n/g, "<br />");
}

export function PlainTextViewer({
  document,
  onTextSelect,
  annotations = [],
  onSave,
}: PlainTextViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(document.title);
  const [draftContent, setDraftContent] = useState(document.content);

  const handleMouseUp = useCallback(() => {
    if (isEditing) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (!text) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    onTextSelect(
      text,
      { x: rect.left, y: rect.bottom },
      buildSelectionData(text, document.content)
    );
  }, [document.content, isEditing, onTextSelect]);

  const highlightedHtml = useMemo(
    () =>
      applyHighlights(
        draftContent,
        annotations.filter((annotation) => annotation.contentType === "text")
      ),
    [annotations, draftContent]
  );

  const handleSave = () => {
    const next = {
      ...document,
      title: draftTitle.trim() || "붙여넣은 텍스트",
      content: draftContent,
      charCount: draftContent.length,
    };
    onSave?.(next);
    setIsEditing(false);
  };

  return (
    <div
      onMouseUp={handleMouseUp}
      className="flex-1 overflow-auto bg-white px-8 py-6 max-w-3xl mx-auto"
    >
      <h1 className="font-headline text-3xl font-black mb-4">{document.title}</h1>
      <p className="font-ui text-sm text-[#666] mb-6">
        {document.charCount.toLocaleString()}자
      </p>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setDraftTitle(document.title);
            setDraftContent(document.content);
            setIsEditing(true);
          }}
          className="btn-newsprint px-3 py-1 text-xs"
        >
          편집
        </button>
      </div>
      {isEditing ? (
        <div className="space-y-3">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="w-full px-3 py-2 border-2 border-[#111] font-ui text-sm outline-none"
          />
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            className="w-full min-h-[240px] px-3 py-3 border-2 border-[#111] font-body text-sm outline-none resize-y"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="btn-newsprint btn-newsprint-inverted px-4 py-2 text-sm"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftTitle(document.title);
                setDraftContent(document.content);
                setIsEditing(false);
              }}
              className="btn-newsprint px-4 py-2 text-sm"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <article
          className="font-body text-lg leading-relaxed article-content whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      )}
    </div>
  );
}
