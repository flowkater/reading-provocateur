import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import type { SessionMode, HighlightIntent, Article, PlainTextDocument } from "../types";
import { useContentState } from "../hooks/useContentState";
import { useAnnotations } from "../hooks/useAnnotations";
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
import { PlainTextViewer } from "./PlainTextViewer";

const PdfViewer = lazy(() =>
  import("./PdfViewer").then((m) => ({ default: m.PdfViewer }))
);

interface ReadingViewProps {
  mode: SessionMode;
  onModeChange?: (mode: SessionMode) => void;
  initialArticle?: Article;
  initialTextDocument?: PlainTextDocument;
  initialPdfBlobUrl?: string | null;
  initialPdfTitle?: string;
  initialPage?: number;
  onArticleLoaded?: (article: Article) => void;
  onTextLoaded?: (doc: PlainTextDocument) => void;
  onPdfLoaded?: (file: File) => void;
  onPageChangePersist?: (page: number) => void;
}

const ACTIVE_FLOW_STATES = new Set<string>([
  "loading",
  "question",
  "evaluating",
  "evaluation",
  "modelAnswer",
] as const);

export function ReadingView({
  mode,
  onModeChange,
  initialArticle,
  initialTextDocument,
  initialPdfBlobUrl,
  initialPdfTitle,
  initialPage,
  onArticleLoaded,
  onTextLoaded,
  onPdfLoaded,
  onPageChangePersist,
}: ReadingViewProps) {
  const content = useContentState();
  const { settings, updateSettings, hasApiKey } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [pendingMode, setPendingMode] = useState<SessionMode | null>(null);

  const provider = useMemo(
    () => new AnthropicProvider(settings.apiKey, settings.model),
    [settings.apiKey, settings.model]
  );

  const contentTitle = content.contentSource?.type === "pdf"
    ? content.contentSource.book.fileName
    : content.contentSource?.type === "article"
    ? content.contentSource.article.title
    : content.contentSource?.type === "text"
    ? content.contentSource.text.title
    : "";

  const contentId = content.contentSource?.type === "pdf"
    ? content.contentSource.book.id
    : content.contentSource?.type === "article"
    ? content.contentSource.article.id
    : content.contentSource?.type === "text"
    ? content.contentSource.text.id
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
  const annotationState = useAnnotations(contentId);

  const handleProvoke = (intent: HighlightIntent) => {
    const annotationId = annotationState.saveSelectionAsAnnotation(
      content.selectedText,
      content.selectionData,
      intent
    );
    flow.startProvocation({
      selectedText: content.selectedText,
      intent,
      annotationId,
    });
    content.clearSelection();
  };

  const handleHighlight = () => {
    annotationState.saveSelectionAsAnnotation(
      content.selectedText,
      content.selectionData,
      null
    );
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

  const applyModeChange = (nextMode: SessionMode) => {
    flow.reset();
    content.clearSelection();
    setPendingMode(null);
    onModeChange?.(nextMode);
  };

  const handleModeChange = (nextMode: SessionMode) => {
    if (nextMode === mode) return;

    if (ACTIVE_FLOW_STATES.has(flow.state)) {
      setPendingMode(nextMode);
      return;
    }

    applyModeChange(nextMode);
  };

  const closeModeDialog = () => {
    setPendingMode(null);
  };

  const isArticle = content.contentSource?.type === "article";
  const isText = content.contentSource?.type === "text";

  useEffect(() => {
    if (!initialArticle) return;
    if (content.contentSource?.type === "article") return;

    content.handleArticleLoad(initialArticle);
  }, [content, initialArticle]);

  useEffect(() => {
    if (!initialTextDocument) return;
    if (content.contentSource?.type === "text") return;

    content.handleTextLoad(initialTextDocument);
  }, [content, initialTextDocument]);

  useEffect(() => {
    if (!initialPdfBlobUrl || !initialPdfTitle) return;
    if (content.contentSource?.type === "pdf") return;

    content.handlePdfRestore(initialPdfTitle, initialPdfBlobUrl);
  }, [content, initialPdfBlobUrl, initialPdfTitle]);

  useEffect(() => {
    if (!initialPage) return;
    if (content.contentSource?.type !== "pdf") return;

    content.pdfState.setCurrentPage(initialPage);
  }, [content, initialPage]);

  useEffect(() => {
    if (!onPageChangePersist) return;
    if (content.contentSource?.type !== "pdf") return;

    onPageChangePersist(content.pdfState.currentPage);
  }, [content.contentSource, content.pdfState.currentPage, onPageChangePersist]);

  const handleFileSelect = (file: File) => {
    content.handleFileSelect(file);
    onPdfLoaded?.(file);
  };

  const handleArticleLoad = (article: Article) => {
    content.handleArticleLoad(article);
    onArticleLoaded?.(article);
  };

  const handleTextLoad = (textDoc: PlainTextDocument) => {
    content.handleTextLoad(textDoc);
    onTextLoaded?.(textDoc);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col">
      <NavBar
        bookTitle={contentTitle}
        mode={mode}
        currentPage={isArticle ? 0 : content.pdfState.currentPage}
        onModeChange={handleModeChange}
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
                annotations={annotationState.annotations}
              />
            </Suspense>
          ) : content.contentSource?.type === "article" ? (
            <ArticleViewer
              article={content.contentSource.article}
              onTextSelect={content.handleTextSelect}
              annotations={annotationState.annotations}
            />
          ) : content.contentSource?.type === "text" ? (
            <PlainTextViewer
              document={content.contentSource.text}
              onTextSelect={content.handleTextSelect}
              annotations={annotationState.annotations}
              onSave={handleTextLoad}
            />
          ) : (
            <ContentSelector
              onFileSelect={handleFileSelect}
              onArticleLoad={handleArticleLoad}
              onTextLoad={handleTextLoad}
              onSampleClick={handleSampleClick}
            />
          )}
          {content.selectedText && content.selectionPosition && (
            <FloatingToolbar
              position={content.selectionPosition}
              onProvoke={handleProvoke}
              onHighlight={handleHighlight}
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
            annotations={annotationState.annotations}
            hasApiKey={hasApiKey}
            onSubmitAnswer={flow.submitAnswer}
            onRetry={flow.submitRetry}
            onSkip={flow.skipRetry}
            onShowAnswer={flow.showAnswer}
            onSave={flow.saveAndNext}
            onProvoke={handleProvoke}
            onPageJump={content.pdfState.setCurrentPage}
            onOpenSettings={() => setShowSettings(true)}
            onUpdateAnnotationIntent={annotationState.updateAnnotationIntent}
            onDeleteAnnotation={annotationState.deleteAnnotation}
          />
        </div>
      </div>

      {!isArticle && !isText && (
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

      {pendingMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={closeModeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="모드 전환 확인"
            className="bg-[#F9F9F7] border-2 border-[#111] w-full max-w-md p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-headline text-2xl font-bold mb-4">
              진행 중인 도발이 있습니다
            </h2>
            <p className="font-ui text-sm text-[#666] mb-6">
              모드를 바꾸면 현재 도발 흐름이 사라집니다. 전환할까요?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => applyModeChange(pendingMode)}
                className="btn-newsprint btn-newsprint-inverted flex-1 py-2 text-sm"
              >
                전환
              </button>
              <button
                type="button"
                onClick={closeModeDialog}
                className="btn-newsprint flex-1 py-2 text-sm"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
