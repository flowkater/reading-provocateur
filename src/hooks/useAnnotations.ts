import { useCallback, useState } from "react";
import {
  deleteAnnotation as deleteAnnotationFromStore,
  getAnnotations,
  saveAnnotation,
  updateAnnotation as updateAnnotationInStore,
} from "../lib/store";
import type { Annotation, HighlightIntent, SelectionData } from "../types";

export function useAnnotations(bookId: string) {
  const [annotationsByBookId, setAnnotationsByBookId] = useState<
    Record<string, Annotation[]>
  >(() => (bookId ? { [bookId]: getAnnotations(bookId) } : {}));
  const annotations = bookId
    ? annotationsByBookId[bookId] ?? getAnnotations(bookId)
    : [];

  const saveSelectionAsAnnotation = useCallback(
    (
      selectedText: string | null,
      selectionData: SelectionData | null,
      intent: HighlightIntent | null
    ): string | null => {
      if (!bookId || !selectedText || !selectionData) return null;

      const annotation: Annotation = {
        id: crypto.randomUUID(),
        bookId,
        pageNumber: selectionData.pageNumber,
        contentType: selectionData.contentType,
        selectedText,
        highlightAreas:
          selectionData.contentType === "pdf"
            ? selectionData.highlightAreas
            : undefined,
        quote:
          selectionData.contentType === "article"
            ? selectionData.quote
            : undefined,
        contextBefore:
          selectionData.contentType === "article"
            ? selectionData.contextBefore
            : undefined,
        contextAfter:
          selectionData.contentType === "article"
            ? selectionData.contextAfter
            : undefined,
        intent,
        createdAt: new Date().toISOString(),
      };

      saveAnnotation(annotation);
      setAnnotationsByBookId((prev) => ({
        ...prev,
        [bookId]: [...(prev[bookId] ?? getAnnotations(bookId)), annotation],
      }));
      return annotation.id;
    },
    [bookId]
  );

  const updateAnnotationIntent = useCallback(
    (annotationId: string, intent: HighlightIntent | null) => {
      updateAnnotationInStore(annotationId, { intent });
      setAnnotationsByBookId((prev) => ({
        ...prev,
        [bookId]: (prev[bookId] ?? getAnnotations(bookId)).map((annotation) =>
          annotation.id === annotationId ? { ...annotation, intent } : annotation
        ),
      }));
    },
    [bookId]
  );

  const deleteAnnotation = useCallback(
    (annotationId: string) => {
      deleteAnnotationFromStore(annotationId);
      setAnnotationsByBookId((prev) => ({
        ...prev,
        [bookId]: (prev[bookId] ?? getAnnotations(bookId)).filter(
          (annotation) => annotation.id !== annotationId
        ),
      }));
    },
    [bookId]
  );

  return {
    annotations,
    saveSelectionAsAnnotation,
    updateAnnotationIntent,
    deleteAnnotation,
  };
}
