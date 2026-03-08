import { useState } from "react";
import type { Provocation, ConfidenceLevel } from "../types";

interface ProvocationCardProps {
  provocation: Provocation;
  onSubmit: (answer: string, confidence: ConfidenceLevel) => void;
}

const CONFIDENCE_OPTIONS: { value: ConfidenceLevel; label: string }[] = [
  { value: "low", label: "낮음" },
  { value: "medium", label: "중간" },
  { value: "high", label: "높음" },
];

export function ProvocationCard({ provocation, onSubmit }: ProvocationCardProps) {
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);

  const canSubmit = answer.trim().length > 0 && confidence !== null;

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit(answer, confidence!);
    }
  };

  return (
    <div className="p-4 border-2 border-[#111] bg-[#F9F9F7]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-data text-xs uppercase tracking-widest bg-[#111] text-[#F9F9F7] px-1.5 py-0.5">
          {provocation.kind}
        </span>
        <span className="font-data text-xs text-[#666]">
          {provocation.sessionMode} · {provocation.intent ?? "page"}
        </span>
      </div>

      {/* Page + highlight */}
      <div className="mb-3">
        <span className="font-data text-xs text-[#666]">p.{provocation.pageNumber}</span>
        {provocation.selectedText && (
          <p className="text-sm bg-[rgba(254,243,199,0.6)] px-2 py-1 mt-1 font-body">
            {provocation.selectedText}
          </p>
        )}
      </div>

      {/* Question */}
      <p className="font-body text-base font-semibold mb-4">
        {provocation.question}
      </p>

      {/* Answer textarea */}
      <textarea
        className="input-newsprint w-full p-2 mb-3 min-h-[80px] resize-y text-sm border-2 border-[#111]"
        placeholder="답변을 입력하세요..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />

      {/* Confidence chips */}
      <div className="flex gap-2 mb-4">
        {CONFIDENCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setConfidence(opt.value)}
            className={`px-3 py-1 font-ui text-xs border-2 border-[#111] transition-colors ${
              confidence === opt.value
                ? "bg-[#111] text-[#F9F9F7]"
                : "bg-[#F9F9F7] text-[#111] hover:shadow-hard-sm"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="btn-newsprint w-full py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        제출
      </button>
    </div>
  );
}
