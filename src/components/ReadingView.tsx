import { useState, useMemo, lazy, Suspense } from "react";
import type { SessionMode, HighlightIntent } from "../types";
import { useContentState } from "../hooks/useContentState";
import { useSettings } from "../hooks/useSettings";
import { useProvocationFlow } from "../hooks/useProvocationFlow";
import { AnthropicProvider } from "../lib/anthropic-provider";
import { LoadingCard } from "./LoadingCard";
import { ContentSelector } from "./FileDropZone";
import { FloatingToolbar } from "./FloatingToolbar";
import { NavBar } from "./NavBar";
import { BottomBar } from "./BottomBar";
import { SidePanel } from "./SidePanel";
import { SettingsDialog } from "./SettingsDialog";
import { ArticleViewer } from "./ArticleViewer";

const PdfViewer = lazy(() =>
  import("./PdfViewer").then((m) => ({ default: m.PdfViewer }))
);

interface ReadingViewProps {
  mode: SessionMode;
}

export function ReadingView({ mode }: ReadingViewProps) {
  const content = useContentState();
  const { settings, updateSettings, hasApiKey } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const provider = useMemo(
    () => new AnthropicProvider(settings.apiKey, settings.model),
    [settings.apiKey, settings.model]
  );

  const contentTitle = content.contentSource?.type === "pdf"
    ? content.contentSource.book.fileName
    : content.contentSource?.type === "article"
    ? content.contentSource.article.title
    : "";

  const contentId = content.contentSource?.type === "pdf"
    ? content.contentSource.book.id
    : content.contentSource?.type === "article"
    ? content.contentSource.article.id
    : "";

  const flowContext = useMemo(
    () => ({
      bookId: contentId,
      bookTitle: contentTitle,
      sessionMode: mode,
      pageNumber: content.pdfState.currentPage,
      pageText: content.pageText,
    }),
    [contentId, contentTitle, mode, content.pdfState.currentPage, content.pageText]
  );

  const flow = useProvocationFlow(provider, flowContext);

  const handleProvoke = (intent: HighlightIntent) => {
    flow.startProvocation({
      selectedText: content.selectedText,
      intent,
    });
    content.clearSelection();
  };

  const handleSampleClick = async () => {
    try {
      const res = await fetch("/sample.pdf");
      const blob = await res.blob();
      const file = new File([blob], "sample.pdf", { type: "application/pdf" });
      content.handleFileSelect(file);
    } catch (err) {
      console.warn("[sample] Failed to load sample PDF:", err);
    }
  };

  const isArticle = content.contentSource?.type === "article";

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col">
      <NavBar
        bookTitle={contentTitle}
        mode={mode}
        currentPage={isArticle ? 0 : content.pdfState.currentPage}
        onSettingsClick={() => setShowSettings(true)}
        onExportClick={() => {}}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 70% Content */}
        <div className="w-[70%] max-lg:w-full relative">
          {content.contentSource?.type === "pdf" ? (
            <Suspense fallback={<LoadingCard message="PDF 로딩 중..." />}>
              <PdfViewer
                fileUrl={content.contentSource.fileUrl}
                currentPage={content.pdfState.currentPage}
                onPageChange={content.pdfState.setCurrentPage}
                onTotalPagesChange={content.pdfState.setTotalPages}
                onTextSelect={content.handleTextSelect}
                onPageTextExtract={content.setPageText}
              />
            </Suspense>
          ) : content.contentSource?.type === "article" ? (
            <ArticleViewer
              article={content.contentSource.article}
              onTextSelect={content.handleTextSelect}
            />
          ) : (
            <ContentSelector
              onFileSelect={content.handleFileSelect}
              onArticleLoad={content.handleArticleLoad}
              onSampleClick={handleSampleClick}
            />
          )}
          {content.selectedText && content.selectionPosition && (
            <FloatingToolbar
              position={content.selectionPosition}
              onProvoke={handleProvoke}
              onHighlight={() => content.clearSelection()}
              onClose={content.clearSelection}
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
            onPageJump={content.pdfState.setCurrentPage}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>
      </div>

      {!isArticle && (
        <BottomBar
          currentPage={content.pdfState.currentPage}
          totalPages={content.pdfState.totalPages}
        />
      )}

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
