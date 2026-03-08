import type { AiProvider } from "./ai-provider";
import { buildModelAnswerPrompt } from "./prompts";

export interface ModelAnswerInput {
  question: string;
  answer: string;
  contextExcerpt: string;
  missingPoints: string[];
}

export async function generateModelAnswer(
  provider: AiProvider,
  input: ModelAnswerInput
): Promise<string> {
  const prompt = buildModelAnswerPrompt(input);

  try {
    return await provider.generateModelAnswer(prompt);
  } catch {
    return "모범 답안을 생성할 수 없습니다.";
  }
}
