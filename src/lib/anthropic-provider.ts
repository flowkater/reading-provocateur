import Anthropic from "@anthropic-ai/sdk";
import { ProvocationPayloadSchema, EvaluationPayloadSchema } from "./schemas";
import type { ProvocationPayload, EvaluationPayload } from "./schemas";
import type {
  AiProvider,
  GenerateProvocationInput,
  EvaluateAnswerInput,
  ModelAnswerInput,
} from "./ai-provider";

export class AnthropicProvider implements AiProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = "claude-sonnet-4-6") {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.model = model;
  }

  async generateProvocation(input: GenerateProvocationInput): Promise<ProvocationPayload> {
    return this.callWithJsonRetry(
      input,
      (text) => ProvocationPayloadSchema.parse(JSON.parse(text)),
    );
  }

  async evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluationPayload> {
    return this.callWithJsonRetry(
      input,
      (text) => EvaluationPayloadSchema.parse(JSON.parse(text)),
    );
  }

  async generateModelAnswer(input: ModelAnswerInput): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: input.system,
      messages: [{ role: "user", content: input.user }],
    });
    const block = response.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");
    return block.text.trim();
  }

  private async callWithJsonRetry<T>(
    input: { system: string; user: string },
    parse: (text: string) => T,
  ): Promise<T> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: input.system,
      messages: [{ role: "user", content: input.user }],
    });
    const block = response.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");

    try {
      return parse(block.text);
    } catch {
      // 1회 재시도: 강화 프롬프트
      const retryResponse = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: input.system + "\n\n중요: 반드시 JSON으로만 응답하세요. 다른 텍스트를 포함하지 마세요.",
        messages: [{ role: "user", content: input.user }],
      });
      const retryBlock = retryResponse.content[0];
      if (retryBlock.type !== "text") throw new Error("Unexpected response type");
      return parse(retryBlock.text);
    }
  }
}
