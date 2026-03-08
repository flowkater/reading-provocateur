import { useState } from "react";
import type { Provocation, EvaluationVerdict } from "../types";

interface EvaluationCardProps {
  provocation: Provocation;
  onRetry: (retryAnswer: string) => void;
  onSkip: () => void;
  onShowAnswer: () => void;
}

function VerdictBadge({ verdict }: { verdict: EvaluationVerdict }) {
  const styles: Record<EvaluationVerdict, { emoji: string; color: string }> = {
    correct: { emoji: "✅", color: "text-emerald-700" },
    partial: { emoji: "🟡", color: "text-amber-700" },
    incorrect: { emoji: "❌", color: "text-red-700" },
    memorized: { emoji: "📦", color: "text-neutral-700" },
  };
  const s = styles[verdict];
  return (
    <span className={`font-ui text-sm font-bold uppercase ${s.color}`}>
      {s.emoji} {verdict}
    </span>
  );
}

export function EvaluationCard({
  provocation,
  onRetry,
  onSkip,
  onShowAnswer,
}: EvaluationCardProps) {
  const [retryAnswer, setRetryAnswer] = useState("");
  const eval_ = provocation.evaluation!;

  const handleRetry = () => {
    if (retryAnswer.trim()) {
      onRetry(retryAnswer);
    }
  };

  return (
    <div className="p-4 border-2 border-[#111] bg-[#F9F9F7]">
      {/* Verdict */}
      <div className="mb-4">
        <VerdictBadge verdict={eval_.verdict} />
      </div>

      {/* What was right */}
      {eval_.whatWasRight.length > 0 && (
        <div className="mb-3">
          <p className="font-ui text-xs uppercase tracking-widest text-[#666] mb-1">
            맞은 점
          </p>
          <ul className="list-disc list-inside text-sm font-body">
            {eval_.whatWasRight.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing points */}
      {eval_.missingPoints.length > 0 && (
        <div className="mb-3">
          <p className="font-ui text-xs uppercase tracking-widest text-[#666] mb-1">
            빠진 점
          </p>
          <ul className="list-disc list-inside text-sm font-body">
            {eval_.missingPoints.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up question */}
      {eval_.followUpQuestion && (
        <p className="font-body text-sm italic text-[#666] mb-4">
          {eval_.followUpQuestion}
        </p>
      )}

      {/* Retry verdict display */}
      {eval_.retryVerdict && (
        <div className="mb-3 p-2 border border-[#ccc]">
          <p className="font-ui text-xs text-[#666] mb-1">재시도 결과:</p>
          <VerdictBadge verdict={eval_.retryVerdict} />
        </div>
      )}

      {/* Retry textarea */}
      {eval_.verdict !== "correct" && !eval_.retryAnswer && (
        <div className="mb-4">
          <textarea
            className="input-newsprint w-full p-2 min-h-[60px] resize-y text-sm border-2 border-[#111]"
            placeholder="다시 답변하세요..."
            value={retryAnswer}
            onChange={(e) => setRetryAnswer(e.target.value)}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {eval_.verdict === "correct" ? (
          <button onClick={onSkip} className="btn-newsprint btn-newsprint-inverted w-full py-2 text-sm">
            저장
          </button>
        ) : (
          <>
            {!eval_.retryAnswer && (
              <button
                onClick={handleRetry}
                disabled={!retryAnswer.trim()}
                className="btn-newsprint btn-newsprint-inverted w-full py-2 text-sm disabled:opacity-40"
              >
                다시 답변
              </button>
            )}
            <button
              onClick={onSkip}
              className="btn-newsprint w-full py-2 text-sm"
            >
              저장하고 넘어가기
            </button>
            <button
              onClick={onShowAnswer}
              className="font-ui text-xs text-[#666] underline hover:text-[#111] text-center py-1"
            >
              정답 보기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
