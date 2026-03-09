import { useState, useMemo } from "react";
import type { SessionMode, HighlightIntent } from "../types";
import { usePdfState } from "../hooks/usePdfState";
import { useSettings } from "../hooks/useSettings";
import { useProvocationFlow } from "../hooks/useProvocationFlow";
import { AnthropicProvider } from "../lib/anthropic-provider";
import { PdfViewer } from "./PdfViewer";
import { FileDropZone } from "./FileDropZone";
import { FloatingToolbar } from "./FloatingToolbar";
import { NavBar } from "./NavBar";
import { BottomBar } from "./BottomBar";
import { SidePanel } from "./SidePanel";
import { SettingsDialog } from "./SettingsDialog";

interface ReadingViewProps {
  mode: SessionMode;
}

export function ReadingView({ mode }: ReadingViewProps) {
  const pdf = usePdfState();
  const { settings, updateSettings, hasApiKey } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const provider = useMemo(
    () => new AnthropicProvider(settings.apiKey, settings.model),
    [settings.apiKey, settings.model]
  );

  const flow = useProvocationFlow(provider, {
    bookId: pdf.book?.id ?? "",
    bookTitle: pdf.book?.fileName ?? "",
    sessionMode: mode,
    pageNumber: pdf.currentPage,
    pageText: pdf.pageText,
  });

  const handleProvoke = (intent: HighlightIntent) => {
    flow.startProvocation({
      selectedText: pdf.selectedText,
      intent,
    });
    pdf.clearSelection();
  };

  const handleSampleClick = async () => {
    try {
      const res = await fetch("/sample.pdf");
      const blob = await res.blob();
      const file = new File([blob], "sample.pdf", { type: "application/pdf" });
      pdf.handleFileSelect(file);
    } catch {
      // fallback: just set a URL
      pdf.handleFileSelect(new File([], "sample.pdf", { type: "application/pdf" }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col">
      <NavBar
        bookTitle={pdf.book?.fileName ?? ""}
        mode={mode}
        currentPage={pdf.currentPage}
        onSettingsClick={() => setShowSettings(true)}
        onExportClick={() => {}}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 70% PDF */}
        <div className="w-[70%] max-lg:w-full relative">
          {pdf.fileUrl ? (
            <PdfViewer
              fileUrl={pdf.fileUrl}
              currentPage={pdf.currentPage}
              onPageChange={pdf.setCurrentPage}
              onTotalPagesChange={pdf.setTotalPages}
              onTextSelect={pdf.handleTextSelect}
              onPageTextExtract={pdf.setPageText}
            />
          ) : (
            <FileDropZone
              onFileSelect={pdf.handleFileSelect}
              onSampleClick={handleSampleClick}
            />
          )}
          {pdf.selectedText && pdf.selectionPosition && (
            <FloatingToolbar
              position={pdf.selectionPosition}
              onProvoke={handleProvoke}
              onHighlight={() => pdf.clearSelection()}
              onClose={pdf.clearSelection}
            />
          )}
        </div>

        {/* 30% SidePanel */}
        <div className="w-[30%] max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:w-full max-lg:h-[60vh] border-l border-[#E0E0E0]">
          <SidePanel
            state={flow.state}
            provocation={flow.currentProvocation}
            modelAnswer={flow.currentProvocation?.modelAnswer ?? null}
            error={flow.error}
            history={flow.history}
            hasApiKey={hasApiKey}
            onSubmitAnswer={flow.submitAnswer}
            onRetry={flow.submitRetry}
            onSkip={flow.skipRetry}
            onShowAnswer={flow.showAnswer}
            onSave={flow.saveAndNext}
            onProvoke={handleProvoke}
            onPageJump={pdf.setCurrentPage}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>
      </div>

      <BottomBar currentPage={pdf.currentPage} totalPages={pdf.totalPages} />

      {showSettings && (
        <SettingsDialog
          settings={settings}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
