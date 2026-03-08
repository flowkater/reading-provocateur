import type { HighlightIntent } from "../types";

interface EmptyStateProps {
  onProvoke?: (intent: HighlightIntent) => void;
  showIntentChips?: boolean;
}

const INTENT_CHIPS: { intent: HighlightIntent; label: string }[] = [
  { intent: "core", label: "핵심" },
  { intent: "confused", label: "헷갈림" },
  { intent: "connection", label: "연결" },
  { intent: "apply", label: "적용" },
];

export function EmptyState({ onProvoke, showIntentChips }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <p className="font-headline text-xl mb-4 text-[#666]">
        텍스트를 선택하거나
      </p>
      {showIntentChips && onProvoke ? (
        <div>
          <p className="font-ui text-sm text-[#666] mb-3">
            왜 여기서 묻길 원해?
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {INTENT_CHIPS.map((chip) => (
              <button
                key={chip.intent}
                onClick={() => onProvoke(chip.intent)}
                className="btn-newsprint px-3 py-1.5 text-xs"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="font-ui text-sm text-[#999]">
          아래 버튼으로 도발을 시작하세요
        </p>
      )}
    </div>
  );
}
