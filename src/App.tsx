import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { ReadingView } from "./components/ReadingView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { Article, PlainTextDocument, SessionMode } from "./types";
import { HomeScreen } from "./components/HomeScreen";
import { RestoreSessionCard } from "./components/RestoreSessionCard";
import {
  getReadingSession,
  listRecentDocuments,
  listReadingSessions,
  saveReadingSession,
  saveRecentDocument,
  updateReadingSession,
  deleteReadingSessionsByBlobIds,
  deleteRecentDocumentsByBlobIds,
} from "./lib/reading-history";
import {
  computePdfFingerprint,
  getPdfBlob,
  pruneStoredPdfs,
  savePdfBlob,
  touchPdfBlob,
} from "./lib/pdf-storage";

function App() {
  const [mode, setMode] = useState<SessionMode | null>(null);
  const [, setHistoryVersion] = useState(0);
  const navigate = useNavigate();
  const recentDocuments = listRecentDocuments();
  const recentSessions = listReadingSessions();

  const handleModeSelect = (m: SessionMode) => {
    setMode(m);
    navigate("/reading");
  };

  const refreshHistory = () => {
    setHistoryVersion((version) => version + 1);
  };

  const upsertArticleSession = (
    article: Article,
    sessionMode: SessionMode,
    existingSessionId?: string
  ) => {
    const sessionId = existingSessionId ?? crypto.randomUUID();
    const documentId = `article:${article.url}`;
    const existingSession = existingSessionId
      ? getReadingSession(existingSessionId)
      : null;

    saveRecentDocument({
      id: documentId,
      type: "article",
      title: article.title,
      addedAt: article.addedAt,
      lastOpenedAt: new Date().toISOString(),
      lastSessionId: sessionId,
      articleSnapshot: article,
    });

    saveReadingSession({
      id: sessionId,
      documentId,
      documentType: "article",
      title: article.title,
      mode: sessionMode,
      startedAt: existingSession?.startedAt ?? new Date().toISOString(),
      endedAt: null,
      currentPage: 1,
      firstPage: 1,
      lastPage: 1,
      restorable: true,
      articleResume: { articleId: article.id },
    });

    refreshHistory();
    navigate(`/reading/${sessionId}`, { replace: true });
  };

  const upsertTextSession = (
    textDoc: PlainTextDocument,
    sessionMode: SessionMode,
    existingSessionId?: string
  ) => {
    const sessionId = existingSessionId ?? crypto.randomUUID();
    const documentId = `text:${textDoc.id}`;
    const existingSession = existingSessionId
      ? getReadingSession(existingSessionId)
      : null;

    saveRecentDocument({
      id: documentId,
      type: "text",
      title: textDoc.title,
      addedAt: textDoc.addedAt,
      lastOpenedAt: new Date().toISOString(),
      lastSessionId: sessionId,
      textSnapshot: textDoc,
    });

    saveReadingSession({
      id: sessionId,
      documentId,
      documentType: "text",
      title: textDoc.title,
      mode: sessionMode,
      startedAt: existingSession?.startedAt ?? new Date().toISOString(),
      endedAt: null,
      currentPage: 1,
      firstPage: 1,
      lastPage: 1,
      restorable: true,
      textResume: { textId: textDoc.id },
    });

    refreshHistory();
    navigate(`/reading/${sessionId}`, { replace: true });
  };

  const upsertPdfSession = async (
    file: File,
    sessionMode: SessionMode,
    existingSessionId?: string,
    currentPage = 1
  ) => {
    const sessionId = existingSessionId ?? crypto.randomUUID();
    const fingerprint = computePdfFingerprint(file);
    const documentId = `pdf:${fingerprint}`;
    const existingSession = existingSessionId
      ? getReadingSession(existingSessionId)
      : null;
    const startedAt = existingSession?.startedAt ?? new Date().toISOString();

    try {
      const storedPdf = await savePdfBlob(file);

      saveRecentDocument({
        id: documentId,
        type: "pdf",
        title: file.name,
        addedAt: startedAt,
        lastOpenedAt: new Date().toISOString(),
        lastSessionId: sessionId,
        pdfMeta: {
          fileName: file.name,
          pdfBlobId: storedPdf.id,
          fingerprint: storedPdf.fingerprint,
          size: storedPdf.size,
          mimeType: storedPdf.mimeType,
          persistedAt: storedPdf.createdAt,
        },
      });

      saveReadingSession({
        id: sessionId,
        documentId,
        documentType: "pdf",
        title: file.name,
        mode: sessionMode,
        startedAt,
        endedAt: null,
        currentPage,
        firstPage: existingSession?.firstPage ?? 1,
        lastPage: Math.max(existingSession?.lastPage ?? 1, currentPage),
        restorable: true,
        pdfResume: {
          fileName: file.name,
          pdfBlobId: storedPdf.id,
          fingerprint: storedPdf.fingerprint,
        },
      });

      const pruneResult = await pruneStoredPdfs(10);
      deleteRecentDocumentsByBlobIds(pruneResult.deletedBlobIds);
      deleteReadingSessionsByBlobIds(pruneResult.deletedBlobIds);
    } catch {
      saveRecentDocument({
        id: documentId,
        type: "pdf",
        title: file.name,
        addedAt: startedAt,
        lastOpenedAt: new Date().toISOString(),
        lastSessionId: sessionId,
        pdfMeta: {
          fileName: file.name,
          fingerprint,
          size: file.size,
          mimeType: file.type || "application/pdf",
        },
      });

      saveReadingSession({
        id: sessionId,
        documentId,
        documentType: "pdf",
        title: file.name,
        mode: sessionMode,
        startedAt,
        endedAt: null,
        currentPage,
        firstPage: existingSession?.firstPage ?? 1,
        lastPage: Math.max(existingSession?.lastPage ?? 1, currentPage),
        restorable: false,
        pdfResume: {
          fileName: file.name,
          fingerprint,
        },
      });
    }

    refreshHistory();
    navigate(`/reading/${sessionId}`, { replace: true });
  };

  const handlePersistedModeChange = (
    sessionId: string | undefined,
    nextMode: SessionMode
  ) => {
    setMode(nextMode);

    if (sessionId) {
      updateReadingSession(sessionId, { mode: nextMode });
      refreshHistory();
    }
  };

  const handlePersistedPageChange = (
    sessionId: string | undefined,
    page: number
  ) => {
    if (!sessionId) return;

    const session = getReadingSession(sessionId);
    if (!session) return;

    updateReadingSession(sessionId, {
      currentPage: page,
      lastPage: Math.max(session.lastPage, page),
    });
    refreshHistory();
  };

  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/"
          element={
            <HomeScreen
              recentDocuments={recentDocuments}
              recentSessions={recentSessions}
              onModeSelect={handleModeSelect}
              onOpenSession={(sessionId) => navigate(`/reading/${sessionId}`)}
            />
          }
        />
        <Route
          path="/reading"
          element={
            <ReadingView
              mode={mode ?? "understand"}
              onModeChange={(nextMode) =>
                handlePersistedModeChange(undefined, nextMode)
              }
              onArticleLoaded={(article) =>
                upsertArticleSession(article, mode ?? "understand")
              }
              onTextLoaded={(textDoc) =>
                upsertTextSession(textDoc, mode ?? "understand")
              }
              onPdfLoaded={(file) =>
                upsertPdfSession(file, mode ?? "understand")
              }
            />
          }
        />
        <Route
          path="/reading/:sessionId"
          element={
            <RestoreReadingRoute
              onModeChange={handlePersistedModeChange}
              onPageChangePersist={handlePersistedPageChange}
              onArticleLoaded={upsertArticleSession}
              onTextLoaded={upsertTextSession}
              onPdfLoaded={upsertPdfSession}
            />
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

function RestoreReadingRoute({
  onModeChange,
  onPageChangePersist,
  onArticleLoaded,
  onTextLoaded,
  onPdfLoaded,
}: {
  onModeChange: (sessionId: string | undefined, mode: SessionMode) => void;
  onPageChangePersist: (sessionId: string | undefined, page: number) => void;
  onArticleLoaded: (
    article: Article,
    sessionMode: SessionMode,
    existingSessionId?: string
  ) => void;
  onTextLoaded: (
    doc: PlainTextDocument,
    sessionMode: SessionMode,
    existingSessionId?: string
  ) => void;
  onPdfLoaded: (
    file: File,
    sessionMode: SessionMode,
    existingSessionId?: string,
    currentPage?: number
  ) => void;
}) {
  const { sessionId } = useParams();
  const [restoredPdfUrl, setRestoredPdfUrl] = useState<string | null>(null);
  const [blobResolved, setBlobResolved] = useState(false);
  const session = sessionId ? getReadingSession(sessionId) : null;
  const document = session
    ? listRecentDocuments().find((recentDocument) => recentDocument.id === session.documentId)
    : null;

  useEffect(() => {
    if (!session) return;
    if (!document) return;
    if (session.documentType !== "pdf") return;

    let objectUrl: string | null = null;
    let cancelled = false;

    const loadBlob = async () => {
      const blobId = session.pdfResume?.pdfBlobId;
      if (!blobId) {
        if (!cancelled) setBlobResolved(true);
        return;
      }

      try {
        const blob = await getPdfBlob(blobId);
        if (!blob) {
          if (!cancelled) setBlobResolved(true);
          return;
        }

        await touchPdfBlob(blobId);
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setRestoredPdfUrl(objectUrl);
          setBlobResolved(true);
        }
      } catch {
        if (!cancelled) {
          setRestoredPdfUrl(null);
        }
      } finally {
        if (!cancelled) {
          setBlobResolved(true);
        }
      }
    };

    if (!session.restorable) {
      setBlobResolved(true);
      return;
    }

    void loadBlob();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document, session]);

  if (!session || !document) {
    return <Navigate to="/" replace />;
  }

  if (session.documentType === "article" && document.articleSnapshot) {
    return (
      <ReadingView
        mode={session.mode}
        onModeChange={(nextMode) => onModeChange(session.id, nextMode)}
        initialArticle={document.articleSnapshot}
        onArticleLoaded={(article) =>
          onArticleLoaded(article, session.mode, session.id)
        }
      />
    );
  }

  if (session.documentType === "text" && document.textSnapshot) {
    return (
      <ReadingView
        mode={session.mode}
        onModeChange={(nextMode) => onModeChange(session.id, nextMode)}
        initialTextDocument={document.textSnapshot}
        onTextLoaded={(textDoc) =>
          onTextLoaded(textDoc, session.mode, session.id)
        }
      />
    );
  }

  if (restoredPdfUrl) {
    return (
      <ReadingView
        mode={session.mode}
        onModeChange={(nextMode) => onModeChange(session.id, nextMode)}
        initialPdfBlobUrl={restoredPdfUrl}
        initialPdfTitle={session.title}
        initialPage={session.currentPage}
        onPdfLoaded={(file) =>
          void onPdfLoaded(file, session.mode, session.id, session.currentPage)
        }
        onPageChangePersist={(page) => onPageChangePersist(session.id, page)}
      />
    );
  }

  if (!blobResolved) {
    return null;
  }

  return (
    <RestoreSessionCard
      session={session}
      onFileSelect={(file) => {
        void onPdfLoaded(file, session.mode, session.id, session.currentPage);
      }}
    />
  );
}

export default function AppRoot() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
