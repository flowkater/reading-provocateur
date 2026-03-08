import { useCallback, useRef } from "react";

interface PdfViewerProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTextSelect: (text: string, rects: DOMRect[]) => void;
}

export function PdfViewer({
  fileUrl: _fileUrl,
  currentPage,
  onPageChange: _onPageChange,
  onTextSelect,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects());
    onTextSelect(text, rects);
  }, [onTextSelect]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-white"
      onMouseUp={handleMouseUp}
    >
      <div className="flex items-center justify-center h-full">
        <p className="font-body text-[#666] text-center p-8">
          PDF Viewer — p.{currentPage}
          <br />
          <span className="text-sm">
            (PDF rendering will be connected with react-pdf-viewer)
          </span>
        </p>
      </div>
    </div>
  );
}
