interface ModelAnswerCardProps {
  modelAnswer: string | null;
  onSave: () => void;
}

export function ModelAnswerCard({ modelAnswer, onSave }: ModelAnswerCardProps) {
  if (!modelAnswer) {
    return (
      <div className="p-4 border-2 border-[#111] bg-[#F9F9F7]">
        <div className="flex gap-1.5 justify-center mb-3">
          <div className="w-2 h-2 bg-[#111] loading-dot" />
          <div className="w-2 h-2 bg-[#111] loading-dot" />
          <div className="w-2 h-2 bg-[#111] loading-dot" />
        </div>
        <p className="font-ui text-sm text-center text-[#666]">
          모범 답안 생성 중...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border-2 border-[#111] bg-[#F9F9F7]">
      <p className="font-ui text-xs uppercase tracking-widest text-[#666] mb-2">
        모범 답안
      </p>
      <p className="font-body text-sm mb-4 leading-relaxed">
        {modelAnswer}
      </p>
      <button
        onClick={onSave}
        className="btn-newsprint btn-newsprint-inverted w-full py-2 text-sm"
      >
        저장하고 넘어가기
      </button>
    </div>
  );
}
