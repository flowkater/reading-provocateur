import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { AiProvider } from "../lib/ai-provider";
import type {
  Provocation,
  SidePanelState,
  HighlightIntent,
  ConfidenceLevel,
  SessionMode,
} from "../types";
import { extractContext } from "../lib/extract-context";
import { buildProvocationPrompt } from "../lib/prompts";
import { buildEvaluationPrompt } from "../lib/prompts";
import { buildModelAnswerPrompt } from "../lib/prompts";
import { buildReviewItem } from "../lib/build-review-items";
import { saveProvocation, updateProvocation, saveReviewItem, getReviewItems } from "../lib/store";

interface FlowContext {
  bookId: string;
  bookTitle: string;
  sessionMode: SessionMode;
  pageNumber: number;
  pageText: string;
}

interface StartInput {
  selectedText: string | null;
  intent: HighlightIntent;
}

export function useProvocationFlow(provider: AiProvider, context: FlowContext) {
  const [state, setState] = useState<SidePanelState>("empty");
  const [currentProvocation, setCurrentProvocation] = useState<Provocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Provocation[]>([]);
  const prevStateRef = useRef<SidePanelState>("empty");

  const startProvocation = useCallback(
    async (input: StartInput) => {
      prevStateRef.current = state;
      setState("loading");
      setError(null);

      try {
        const contextExcerpt = extractContext(context.pageText, input.selectedText);
        const recentWeakConcepts = getReviewItems(context.bookId)
          .filter((r) => r.status === "weak")
          .map((r) => r.conceptLabel);

        const prompt = buildProvocationPrompt({
          bookTitle: context.bookTitle,
          sessionMode: context.sessionMode,
          intent: input.intent,
          selectedText: input.selectedText,
          contextExcerpt,
          recentProvocations: history.slice(-3).map((p) => ({ question: p.question })),
          recentWeakConcepts,
        });

        const result = await provider.generateProvocation(prompt);

        const prov: Provocation = {
          id: uuidv4(),
          bookId: context.bookId,
          annotationId: null,
          pageNumber: context.pageNumber,
          selectedText: input.selectedText,
          contextExcerpt,
          sessionMode: context.sessionMode,
          intent: input.intent,
          kind: result.kind,
          question: result.question,
          answer: null,
          confidence: null,
          createdAt: new Date().toISOString(),
          answeredAt: null,
          evaluation: null,
          modelAnswer: null,
        };

        saveProvocation(prov);
        setCurrentProvocation(prov);
        setState("question");
      } catch (err) {
        setState(prevStateRef.current);
        setError(err instanceof Error ? err.message : "도발 생성에 실패했습니다.");
      }
    },
    [provider, context, state, history]
  );

  const submitAnswer = useCallback(
    async (answer: string, confidence: ConfidenceLevel) => {
      if (!currentProvocation) return;
      prevStateRef.current = state;
      setState("evaluating");

      const answeredAt = new Date().toISOString();
      const updatedProv = { ...currentProvocation, answer, confidence, answeredAt };
      setCurrentProvocation(updatedProv);
      updateProvocation(currentProvocation.id, { answer, confidence, answeredAt });

      try {
        const prompt = buildEvaluationPrompt({
          sessionMode: context.sessionMode,
          question: currentProvocation.question,
          answer,
          confidence,
          selectedText: currentProvocation.selectedText,
          contextExcerpt: currentProvocation.contextExcerpt,
        });

        const evalResult = await provider.evaluateAnswer(prompt);

        const evaluation = {
          verdict: evalResult.verdict,
          whatWasRight: evalResult.whatWasRight,
          missingPoints: evalResult.missingPoints,
          followUpQuestion: evalResult.followUpQuestion,
          retryAnswer: null,
          retryVerdict: null,
          retryEvaluatedAt: null,
        };

        const withEval = { ...updatedProv, evaluation };
        setCurrentProvocation(withEval);
        updateProvocation(currentProvocation.id, { evaluation });

        if (evalResult.verdict === "correct") {
          // Build review item if needed
          const reviewItem = buildReviewItem(withEval);
          if (reviewItem) saveReviewItem(reviewItem);
          setHistory((prev) => [...prev, withEval]);
          setState("saved");
        } else {
          setState("evaluation");
        }
      } catch (err) {
        setState(prevStateRef.current);
        setError(err instanceof Error ? err.message : "평가에 실패했습니다.");
      }
    },
    [provider, currentProvocation, context, state]
  );

  const submitRetry = useCallback(
    async (retryAnswer: string) => {
      if (!currentProvocation?.evaluation) return;
      prevStateRef.current = state;
      setState("evaluating");

      try {
        const prompt = buildEvaluationPrompt({
          sessionMode: context.sessionMode,
          question: currentProvocation.question,
          answer: retryAnswer,
          confidence: currentProvocation.confidence ?? "medium",
          selectedText: currentProvocation.selectedText,
          contextExcerpt: currentProvocation.contextExcerpt,
        });

        const retryResult = await provider.evaluateAnswer(prompt);

        const updatedEval = {
          ...currentProvocation.evaluation,
          retryAnswer,
          retryVerdict: retryResult.verdict,
          retryEvaluatedAt: new Date().toISOString(),
        };

        const updated = { ...currentProvocation, evaluation: updatedEval };
        setCurrentProvocation(updated);
        updateProvocation(currentProvocation.id, { evaluation: updatedEval });

        if (retryResult.verdict === "correct") {
          const reviewItem = buildReviewItem(updated);
          if (reviewItem) saveReviewItem(reviewItem);
          setHistory((prev) => [...prev, updated]);
          setState("saved");
        } else {
          // 2nd failure → model answer
          try {
            const maPrompt = buildModelAnswerPrompt({
              question: currentProvocation.question,
              answer: retryAnswer,
              contextExcerpt: currentProvocation.contextExcerpt,
              missingPoints: retryResult.missingPoints,
            });
            const modelAnswer = await provider.generateModelAnswer(maPrompt);
            const withMA = { ...updated, modelAnswer };
            setCurrentProvocation(withMA);
            updateProvocation(currentProvocation.id, { modelAnswer });
          } catch {
            // ignore model answer failure
          }

          const reviewItem = buildReviewItem(updated);
          if (reviewItem) saveReviewItem(reviewItem);
          setState("modelAnswer");
        }
      } catch (err) {
        setState(prevStateRef.current);
        setError(err instanceof Error ? err.message : "재평가에 실패했습니다.");
      }
    },
    [provider, currentProvocation, context, state]
  );

  const skipRetry = useCallback(() => {
    if (!currentProvocation) return;
    const reviewItem = buildReviewItem(currentProvocation);
    if (reviewItem) saveReviewItem(reviewItem);
    setHistory((prev) => [...prev, currentProvocation]);
    setState("saved");
  }, [currentProvocation]);

  const showAnswer = useCallback(async () => {
    if (!currentProvocation) return;
    try {
      const prompt = buildModelAnswerPrompt({
        question: currentProvocation.question,
        answer: currentProvocation.answer ?? "",
        contextExcerpt: currentProvocation.contextExcerpt,
        missingPoints: currentProvocation.evaluation?.missingPoints ?? [],
      });
      const modelAnswer = await provider.generateModelAnswer(prompt);
      const updated = { ...currentProvocation, modelAnswer };
      setCurrentProvocation(updated);
      updateProvocation(currentProvocation.id, { modelAnswer });

      const reviewItem = buildReviewItem(updated);
      if (reviewItem) saveReviewItem(reviewItem);
      setState("modelAnswer");
    } catch {
      setState("modelAnswer");
    }
  }, [provider, currentProvocation]);

  const saveAndNext = useCallback(() => {
    if (!currentProvocation) return;
    setHistory((prev) => [...prev, currentProvocation]);
    setState("saved");
  }, [currentProvocation]);

  const reset = useCallback(() => {
    setCurrentProvocation(null);
    setError(null);
    setState("empty");
  }, []);

  return {
    state,
    currentProvocation,
    error,
    history,
    startProvocation,
    submitAnswer,
    submitRetry,
    skipRetry,
    showAnswer,
    saveAndNext,
    reset,
  };
}
