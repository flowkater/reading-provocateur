import type { Annotation, HighlightIntent } from "../types";

interface AnnotationListProps {
  annotations: Annotation[];
  onUpdateIntent: (annotationId: string, intent: HighlightIntent | null) => void;
  onDelete: (annotationId: string) => void;
}

const INTENT_OPTIONS: Array<{ value: HighlightIntent | "plain"; label: string }> = [
  { value: "plain", label: "일반 하이라이트" },
  { value: "core", label: "핵심" },
  { value: "confused", label: "헷갈림" },
  { value: "connection", label: "연결" },
  { value: "apply", label: "적용" },
];

export function AnnotationList({
  annotations,
  onUpdateIntent,
  onDelete,
}: AnnotationListProps) {
  if (annotations.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="font-ui text-xs uppercase tracking-widest text-[#666]">
        하이라이트
      </p>
      {annotations
        .slice()
        .reverse()
        .map((annotation) => (
          <div
            key={annotation.id}
            className="border border-neutral-300 bg-white p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-data text-xs uppercase text-[#666]">
                {annotation.contentType} · p.{annotation.pageNumber}
              </span>
              <button
                type="button"
                onClick={() => onDelete(annotation.id)}
                className="font-ui text-xs text-[#CC0000] underline underline-offset-2"
              >
                삭제
              </button>
            </div>
            <p className="font-body text-sm line-clamp-2">{annotation.selectedText}</p>
            <select
              aria-label={`annotation-intent-${annotation.id}`}
              value={annotation.intent ?? "plain"}
              onChange={(event) =>
                onUpdateIntent(
                  annotation.id,
                  event.target.value === "plain"
                    ? null
                    : (event.target.value as HighlightIntent)
                )
              }
              className="w-full px-2 py-1 border border-[#111] bg-transparent font-ui text-xs outline-none"
            >
              {INTENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
    </div>
  );
}
