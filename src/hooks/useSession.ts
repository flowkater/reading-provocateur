import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Book, SessionMode, SessionContext } from "../types";
import { saveBook, saveSession, updateSession as updateSessionStore } from "../lib/store";

export function useSession() {
  const [mode, setMode] = useState<SessionMode | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [sessionCtx, setSessionCtx] = useState<SessionContext | null>(null);

  const selectMode = useCallback((m: SessionMode) => {
    setMode(m);
  }, []);

  const openBook = useCallback(
    (fileName: string, totalPages: number) => {
      const newBook: Book = {
        id: uuidv4(),
        fileName,
        totalPages,
        currentPage: 1,
        addedAt: new Date().toISOString(),
      };
      saveBook(newBook);
      setBook(newBook);

      const ctx: SessionContext = {
        bookId: newBook.id,
        mode: mode ?? "understand",
        startedAt: new Date().toISOString(),
        endedAt: null,
        firstPage: 1,
        lastPage: 1,
      };
      saveSession(ctx);
      setSessionCtx(ctx);
    },
    [mode]
  );

  const updatePage = useCallback(
    (page: number) => {
      if (!book) return;
      const updatedBook = { ...book, currentPage: page };
      setBook(updatedBook);

      if (sessionCtx) {
        const lastPage = Math.max(sessionCtx.lastPage, page);
        const updated = { ...sessionCtx, lastPage };
        setSessionCtx(updated);
        updateSessionStore(sessionCtx.bookId, { lastPage });
      }
    },
    [book, sessionCtx]
  );

  const getSessionContext = useCallback((): SessionContext | null => {
    return sessionCtx;
  }, [sessionCtx]);

  const endSession = useCallback(() => {
    if (!sessionCtx) return;
    const endedAt = new Date().toISOString();
    const updated = { ...sessionCtx, endedAt };
    setSessionCtx(updated);
    updateSessionStore(sessionCtx.bookId, { endedAt });
  }, [sessionCtx]);

  const getDuration = useCallback((): number => {
    if (!sessionCtx) return 0;
    const start = new Date(sessionCtx.startedAt).getTime();
    const end = sessionCtx.endedAt
      ? new Date(sessionCtx.endedAt).getTime()
      : Date.now();
    return Math.round((end - start) / 60000);
  }, [sessionCtx]);

  return {
    mode,
    book,
    selectMode,
    openBook,
    updatePage,
    getSessionContext,
    endSession,
    getDuration,
  };
}
