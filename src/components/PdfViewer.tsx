import { useCallback, useRef, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { getDocument } from "pdfjs-dist";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import type { Annotation, SelectionData } from "../types";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface PdfViewerProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
  onTextSelect: (
    text: string,
    position: { x: number; y: number },
    selectionData?: SelectionData
  ) => void;
  onPageTextExtract: (text: string) => void;
  annotations?: Annotation[];
}

export function PdfViewer({
  fileUrl,
  currentPage,
  onPageChange,
  onTotalPagesChange,
  onTextSelect,
  onPageTextExtract,
  annotations = [],
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects());
    if (rects.length > 0) {
      const rect = rects[0];
      const anchorElement =
        selection.anchorNode instanceof Element
          ? selection.anchorNode
          : selection.anchorNode?.parentElement;
      const pageShell = anchorElement?.closest("[data-page-number]") as HTMLElement | null;
      const pageRect = pageShell?.getBoundingClientRect();
      const pageNumber = Number(pageShell?.dataset.pageNumber ?? currentPage);

      const selectionData = pageRect
        ? {
            contentType: "pdf" as const,
            pageNumber,
            highlightAreas: rects.map((clientRect) => ({
              pageIndex: pageNumber - 1,
              left: (clientRect.left - pageRect.left) / pageRect.width,
              top: (clientRect.top - pageRect.top) / pageRect.height,
              width: clientRect.width / pageRect.width,
              height: clientRect.height / pageRect.height,
            })),
          }
        : undefined;

      onTextSelect(text, { x: rect.left, y: rect.bottom }, selectionData);
    }
  }, [currentPage, onTextSelect]);

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

  useEffect(() => {
    if (!pageCount) return;

    const target = pageRefs.current.get(currentPage);
    target?.scrollIntoView({ block: "start" });
  }, [currentPage, pageCount]);

  useEffect(() => {
    if (!containerRef.current || !pageCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const topVisible = visibleEntries[0];
        if (!topVisible) return;

        const pageNumber = Number(
          (topVisible.target as HTMLElement).dataset.pageNumber
        );

        if (Number.isFinite(pageNumber) && pageNumber !== currentPage) {
          onPageChange(pageNumber);
        }
      },
      {
        root: containerRef.current,
        threshold: [0.5],
      }
    );

    const nodes = Array.from(pageRefs.current.values());
    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [currentPage, onPageChange, pageCount]);

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
        onLoadSuccess={({ numPages }) => {
          setPageCount(numPages);
          onTotalPagesChange(numPages);
        }}
        onLoadError={(err: Error) => setError(err.message)}
      >
        <div
          data-testid="pdf-pages-stack"
          className="flex flex-col items-center gap-6 py-6 px-4"
        >
          {Array.from({ length: pageCount }, (_, index) => {
            const pageNumber = index + 1;

            return (
              <div
                key={pageNumber}
                data-testid={`pdf-page-shell-${pageNumber}`}
                data-page-number={pageNumber}
                className="w-fit bg-white shadow-hard-sm relative"
                ref={(node) => {
                  if (node) {
                    pageRefs.current.set(pageNumber, node);
                  } else {
                    pageRefs.current.delete(pageNumber);
                  }
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
                {annotations
                  .filter(
                    (annotation) =>
                      annotation.contentType === "pdf" &&
                      annotation.pageNumber === pageNumber
                  )
                  .flatMap((annotation) => annotation.highlightAreas ?? [])
                  .map((area, index) => (
                    <div
                      key={`${pageNumber}-${index}`}
                      data-testid={`pdf-highlight-${pageNumber}-${index}`}
                      className="absolute bg-[rgba(254,243,199,0.6)] pointer-events-none"
                      style={{
                        left: `${area.left * 100}%`,
                        top: `${area.top * 100}%`,
                        width: `${area.width * 100}%`,
                        height: `${area.height * 100}%`,
                      }}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </Document>
    </div>
  );
}
