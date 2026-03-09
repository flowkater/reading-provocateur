import { useState, useEffect, useRef } from "react";
import type { Book, Article, ContentSource } from "../types";

export function useContentState() {
  const [contentSource, setContentSource] = useState<ContentSource | null>(null);
  const [pageText, setPageText] = useState("");
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // PDF-specific state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const fileUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    };
  }, []);

  const handleFileSelect = (file: File) => {
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    const url = URL.createObjectURL(file);
    fileUrlRef.current = url;

    const book: Book = {
      id: crypto.randomUUID(),
      fileName: file.name,
      totalPages: 0,
      currentPage: 1,
      addedAt: new Date().toISOString(),
    };

    setContentSource({ type: "pdf", book, fileUrl: url });
    setCurrentPage(1);
    setTotalPages(0);
    setPageText("");
  };

  const handleArticleLoad = (article: Article) => {
    setContentSource({ type: "article", article });
    setPageText(article.content);
    setCurrentPage(1);
    setTotalPages(1);
  };

  const handleTextSelect = (
    text: string,
    position: { x: number; y: number }
  ) => {
    setSelectedText(text);
    setSelectionPosition(position);
  };

  const clearSelection = () => {
    setSelectedText(null);
    setSelectionPosition(null);
  };

  const clear = () => {
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    fileUrlRef.current = null;
    setContentSource(null);
    setPageText("");
    setSelectedText(null);
    setSelectionPosition(null);
    setCurrentPage(1);
    setTotalPages(0);
  };

  return {
    contentSource,
    pageText,
    setPageText,
    selectedText,
    selectionPosition,
    handleTextSelect,
    clearSelection,
    clear,
    // PDF-specific
    pdfState: {
      currentPage,
      totalPages,
      setCurrentPage,
      setTotalPages,
    },
    // Load actions
    handleFileSelect,
    handleArticleLoad,
  };
}
