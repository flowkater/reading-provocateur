import { useCallback, useRef, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { getDocument } from "pdfjs-dist";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface PdfViewerProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
  onTextSelect: (text: string, position: { x: number; y: number }) => void;
  onPageTextExtract: (text: string) => void;
}

export function PdfViewer({
  fileUrl,
  currentPage,
  onPageChange: _onPageChange,
  onTotalPagesChange,
  onTextSelect,
  onPageTextExtract,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects());
    if (rects.length > 0) {
      const rect = rects[0];
      onTextSelect(text, { x: rect.left, y: rect.bottom });
    }
  }, [onTextSelect]);

  // Extract page text using pdfjs-dist
  useEffect(() => {
    let cancelled = false;
    async function extractText() {
      try {
        const doc = await getDocument(fileUrl).promise;
        const page = await doc.getPage(currentPage);
        const content = await page.getTextContent();
        const text = content.items
          .filter((item) => "str" in item)
          .map((item) => (item as { str: string }).str)
          .join(" ");
        if (!cancelled) {
          onPageTextExtract(text);
        }
      } catch {
        // text extraction failure is non-fatal
      }
    }
    extractText();
    return () => { cancelled = true; };
  }, [fileUrl, currentPage, onPageTextExtract]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-white"
      onMouseUp={handleMouseUp}
    >
      {error && (
        <div className="p-4 text-[#CC0000] font-ui text-sm" data-testid="pdf-error">
          PDF 로드 실패: {error}
        </div>
      )}
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => onTotalPagesChange(numPages)}
        onLoadError={(err: Error) => setError(err.message)}
      >
        <Page
          pageNumber={currentPage}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>
    </div>
  );
}
