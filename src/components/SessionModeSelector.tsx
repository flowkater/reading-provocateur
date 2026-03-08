import type { SessionMode } from "../types";

interface ModeOption {
  mode: SessionMode;
  label: string;
  description: string;
  hints: string;
}

const MODES: ModeOption[] = [
  {
    mode: "understand",
    label: "이해",
    description: "핵심 개념을 깊이 이해하고 있는지 확인",
    hints: "recall · compression",
  },
  {
    mode: "apply",
    label: "적용",
    description: "배운 내용을 실제 상황에 적용할 수 있는지 확인",
    hints: "transfer · challenge",
  },
  {
    mode: "exam",
    label: "시험",
    description: "기억력과 정확한 이해를 시험",
    hints: "recall · misconception",
  },
  {
    mode: "critique",
    label: "비판",
    description: "저자의 주장을 비판적으로 검토",
    hints: "challenge · misconception",
  },
];

interface SessionModeSelectorProps {
  selected: string | null;
  onSelect: (mode: SessionMode) => void;
  onSampleClick: () => void;
}

export function SessionModeSelector({
  selected,
  onSelect,
  onSampleClick,
}: SessionModeSelectorProps) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {MODES.map((opt) => {
          const isSelected = selected === opt.mode;
          return (
            <button
              key={opt.mode}
              onClick={() => onSelect(opt.mode)}
              className={`p-6 border-2 text-left transition-all ${
                isSelected
                  ? "bg-[#111] text-[#F9F9F7] border-[#111]"
                  : "bg-[#F9F9F7] text-[#111] border-[#111] hover:shadow-[4px_4px_0px_0px_#111]"
              }`}
            >
              <h3 className="font-headline text-2xl font-bold mb-2">
                {opt.label}
              </h3>
              <p className={`font-body text-sm mb-3 ${isSelected ? "text-[#ccc]" : "text-[#666]"}`}>
                {opt.description}
              </p>
              <span className={`font-data text-xs uppercase tracking-widest ${isSelected ? "text-[#999]" : "text-[#999]"}`}>
                {opt.hints}
              </span>
            </button>
          );
        })}
      </div>
      <div className="text-center">
        <button
          onClick={onSampleClick}
          className="font-ui text-sm text-[#666] underline underline-offset-4 hover:text-[#111] transition-colors"
        >
          샘플로 체험하기
        </button>
      </div>
    </div>
  );
}
