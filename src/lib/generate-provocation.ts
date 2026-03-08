import type { AiProvider } from "./ai-provider";
import type { ProvocationPayload } from "./schemas";
import { buildProvocationPrompt, type ProvocationPromptInput } from "./prompts";

export interface GenerateProvocationInput {
  bookTitle: string;
  sessionMode: ProvocationPromptInput["sessionMode"];
  intent: ProvocationPromptInput["intent"];
  selectedText: string | null;
  contextExcerpt: string;
  pageText: string;
  pageNumber: number;
  recentProvocations: { question: string }[];
  recentWeakConcepts: string[];
}

function isJsonParseError(err: unknown): boolean {
  return err instanceof SyntaxError || (err instanceof Error && err.name === "ZodError");
}

export async function generateProvocation(
  provider: AiProvider,
  input: GenerateProvocationInput
): Promise<ProvocationPayload> {
  const prompt = buildProvocationPrompt({
    bookTitle: input.bookTitle,
    sessionMode: input.sessionMode,
    intent: input.intent,
    selectedText: input.selectedText,
    contextExcerpt: input.contextExcerpt,
    recentProvocations: input.recentProvocations,
    recentWeakConcepts: input.recentWeakConcepts,
  });

  try {
    return await provider.generateProvocation(prompt);
  } catch (err) {
    if (isJsonParseError(err)) {
      // JSON 파싱 실패만 1회 재시도
      return await provider.generateProvocation(prompt);
    }
    throw err;
  }
}
