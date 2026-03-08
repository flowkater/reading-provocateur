import type { ProvocationPayload, EvaluationPayload } from "./schemas";

export interface GenerateProvocationInput {
  system: string;
  user: string;
}

export interface EvaluateAnswerInput {
  system: string;
  user: string;
}

export interface ModelAnswerInput {
  system: string;
  user: string;
}

export interface AiProvider {
  generateProvocation(input: GenerateProvocationInput): Promise<ProvocationPayload>;
  evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluationPayload>;
  generateModelAnswer(input: ModelAnswerInput): Promise<string>;
}
