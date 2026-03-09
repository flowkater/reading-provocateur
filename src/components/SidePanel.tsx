import { useState } from "react";
import type { Provocation, SidePanelState, HighlightIntent, ConfidenceLevel } from "../types";
import { EmptyState } from "./EmptyState";
import { LoadingCard } from "./LoadingCard";
import { ProvocationCard } from "./ProvocationCard";
import { EvaluationCard } from "./EvaluationCard";
import { ModelAnswerCard } from "./ModelAnswerCard";
import { HistoryList } from "./HistoryList";

interface SidePanelProps {
  state: SidePanelState;
  provocation: Provocation | null;
  history: Provocation[];
  modelAnswer: string | null;
  error: string | null;
  hasApiKey: boolean;
  onProvoke: (intent: HighlightIntent) => void;
  onSubmitAnswer: (answer: string, confidence: ConfidenceLevel) => void;
  onRetry: (retryAnswer: string) => void;
  onSkip: () => void;
  onShowAnswer: () => void;
  onSave: () => void;
  onPageJump: (page: number) => void;
  onOpenSettings: () => void;
}

export function SidePanel({
  state,
  provocation,
  history,
  modelAnswer,
  error,
  hasApiKey,
  onProvoke,
  onSubmitAnswer,
  onRetry,
  onSkip,
  onShowAnswer,
  onSave,
  onPageJump,
  onOpenSettings,
}: SidePanelProps) {
  const [showIntentChips, setShowIntentChips] = useState(false);

  const handleProvokeClick = () => {
    if (!hasApiKey) {
      onOpenSettings();
      return;
    }
    setShowIntentChips(true);
  };

  const handleIntentSelect = (intent: HighlightIntent) => {
    setShowIntentChips(false);
    onProvoke(intent);
  };

  const showProvokeButton = state === "empty" || state === "saved";

  return (
    <div role="complementary" aria-label="도발 패널" className="h-full flex flex-col border-l-2 border-[#111] bg-[#F9F9F7]">
      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border-b-2 border-[#CC0000] text-sm font-ui text-[#CC0000]">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4">
        {state === "empty" && (
          showIntentChips ? (
            <EmptyState onProvoke={handleIntentSelect} showIntentChips />
          ) : (
            <EmptyState />
          )
        )}

        {state === "loading" && <LoadingCard message="생각 중..." />}

        {state === "question" && provocation && (
          <ProvocationCard provocation={provocation} onSubmit={onSubmitAnswer} isSubmitting={false} />
        )}

        {state === "evaluating" && <LoadingCard message="평가 중..." />}

        {state === "evaluation" && provocation?.evaluation && (
          <EvaluationCard
            provocation={provocation}
            onRetry={onRetry}
            onSkip={onSkip}
            onShowAnswer={onShowAnswer}
          />
        )}

        {state === "modelAnswer" && (
          <ModelAnswerCard
            modelAnswer={provocation?.modelAnswer ?? modelAnswer}
            onSave={onSave}
          />
        )}

        {state === "saved" && (
          <HistoryList history={history} onPageJump={onPageJump} />
        )}
      </div>

      {/* Bottom CTA */}
      {showProvokeButton && (
        <div className="p-4 border-t-2 border-[#111]">
          <button
            onClick={handleProvokeClick}
            className="btn-newsprint w-full py-2 text-sm"
          >
            도발해줘
          </button>
        </div>
      )}
    </div>
  );
}
