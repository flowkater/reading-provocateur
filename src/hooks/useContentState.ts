import { useState, useEffect, useRef } from "react";
import type {
  Book,
  Article,
  ContentSource,
  PlainTextDocument,
  SelectionData,
} from "../types";

export function useContentState() {
  const [contentSource, setContentSource] = useState<ContentSource | null>(null);
  const [pageText, setPageText] = useState("");
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectionData, setSelectionData] = useState<SelectionData | null>(null);

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

  const handlePdfRestore = (fileName: string, fileUrl: string) => {
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    fileUrlRef.current = fileUrl;

    const book: Book = {
      id: crypto.randomUUID(),
      fileName,
      totalPages: 0,
      currentPage: 1,
      addedAt: new Date().toISOString(),
    };

    setContentSource({ type: "pdf", book, fileUrl });
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

  const handleTextLoad = (textDoc: PlainTextDocument) => {
    setContentSource({ type: "text", text: textDoc });
    setPageText(textDoc.content);
    setCurrentPage(1);
    setTotalPages(1);
  };

  const handleTextSelect = (
    text: string,
    position: { x: number; y: number },
    data?: SelectionData
  ) => {
    setSelectedText(text);
    setSelectionPosition(position);
    setSelectionData(data ?? null);
  };

  const clearSelection = () => {
    setSelectedText(null);
    setSelectionPosition(null);
    setSelectionData(null);
  };

  const clear = () => {
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    fileUrlRef.current = null;
    setContentSource(null);
    setPageText("");
    setSelectedText(null);
    setSelectionPosition(null);
    setSelectionData(null);
    setCurrentPage(1);
    setTotalPages(0);
  };

  return {
    contentSource,
    pageText,
    setPageText,
    selectedText,
    selectionPosition,
    selectionData,
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
    handlePdfRestore,
    handleArticleLoad,
    handleTextLoad,
  };
}
