import { useMemo } from "react";
import type { Provocation, ReviewItem, SessionContext, Settings } from "../types";
import { generateExportMarkdown } from "../lib/export";

interface ExportPreviewProps {
  bookTitle: string;
  session: SessionContext;
  provocations: Provocation[];
  reviewItems: ReviewItem[];
  settings: Settings;
  onClose: () => void;
}

export function ExportPreview({
  bookTitle,
  session,
  provocations,
  reviewItems,
  settings,
  onClose,
}: ExportPreviewProps) {
  const markdown = useMemo(
    () =>
      generateExportMarkdown({
        bookTitle,
        session,
        provocations,
        reviewItems,
        settings,
      }),
    [bookTitle, session, provocations, reviewItems, settings]
  );

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reading-provocateur-${bookTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div role="dialog" aria-modal="true" aria-label="Export 미리보기" className="bg-[#F9F9F7] border-2 border-[#111] w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b-2 border-[#111]">
          <h2 className="font-headline text-xl font-bold">Export Preview</h2>
          <button onClick={onClose} className="font-ui text-sm text-[#666] hover:text-[#111]">
            닫기
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="font-data text-xs whitespace-pre-wrap leading-relaxed">
            {markdown}
          </pre>
        </div>
        <div className="p-4 border-t-2 border-[#111]">
          <button
            onClick={handleDownload}
            className="btn-newsprint btn-newsprint-inverted w-full py-2 text-sm"
          >
            다운로드 (.md)
          </button>
        </div>
      </div>
    </div>
  );
}
