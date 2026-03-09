import { useState, useEffect, useRef } from "react";
import type { Book } from "../types";

export function usePdfState() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageText, setPageText] = useState("");
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
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
    setFileUrl(url);
    setBook({
      id: crypto.randomUUID(),
      fileName: file.name,
      totalPages: 0,
      currentPage: 1,
      addedAt: new Date().toISOString(),
    });
  };

  const handleTextSelect = (text: string, position: { x: number; y: number }) => {
    setSelectedText(text);
    setSelectionPosition(position);
  };

  const clearSelection = () => {
    setSelectedText(null);
    setSelectionPosition(null);
  };

  return {
    fileUrl,
    book,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    pageText,
    setPageText,
    selectedText,
    selectionPosition,
    handleFileSelect,
    handleTextSelect,
    clearSelection,
  };
}
