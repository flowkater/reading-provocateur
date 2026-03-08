import type { Provocation, EvaluationVerdict } from "../types";

interface HistoryListProps {
  history: Provocation[];
  onPageJump: (page: number) => void;
}

function verdictEmoji(verdict?: EvaluationVerdict | null): string {
  if (!verdict) return "";
  const map: Record<EvaluationVerdict, string> = {
    correct: "✅",
    partial: "🟡",
    incorrect: "❌",
    memorized: "📦",
  };
  return map[verdict];
}

export function HistoryList({ history, onPageJump }: HistoryListProps) {
  if (history.length === 0) return null;

  const sorted = [...history].reverse();

  return (
    <div className="space-y-2">
      <p className="font-ui text-xs uppercase tracking-widest text-[#666] mb-2">
        이전 도발
      </p>
      {sorted.map((prov) => (
        <button
          key={prov.id}
          onClick={() => onPageJump(prov.pageNumber)}
          className="w-full text-left p-3 border border-neutral-300 hover:border-[#111] transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-data text-xs uppercase bg-[#111] text-[#F9F9F7] px-1">
              {prov.kind}
            </span>
            <span className="font-data text-xs text-[#666]">
              p.{prov.pageNumber}
            </span>
            <span className="font-data text-xs text-[#666]">
              {prov.intent ?? "page"}
            </span>
            {prov.evaluation && (
              <span className="text-xs">
                {verdictEmoji(prov.evaluation.verdict)}
              </span>
            )}
            {prov.confidence && (
              <span className="font-data text-xs text-[#999]">
                {prov.confidence}
              </span>
            )}
          </div>
          <p className="font-body text-xs truncate">{prov.question}</p>
        </button>
      ))}
    </div>
  );
}
