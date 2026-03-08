import type { AiProvider } from "./ai-provider";
import type { EvaluationPayload } from "./schemas";
import { buildEvaluationPrompt } from "./prompts";
import type { SessionMode, ConfidenceLevel } from "../types";

export interface EvaluateAnswerInput {
  sessionMode: SessionMode;
  question: string;
  answer: string;
  confidence: ConfidenceLevel;
  selectedText: string | null;
  contextExcerpt: string;
}

export async function evaluateAnswer(
  provider: AiProvider,
  input: EvaluateAnswerInput
): Promise<EvaluationPayload> {
  const prompt = buildEvaluationPrompt({
    sessionMode: input.sessionMode,
    question: input.question,
    answer: input.answer,
    confidence: input.confidence,
    selectedText: input.selectedText,
    contextExcerpt: input.contextExcerpt,
  });

  try {
    return await provider.evaluateAnswer(prompt);
  } catch {
    // 1회 재시도
    return await provider.evaluateAnswer(prompt);
  }
}
