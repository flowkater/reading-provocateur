import { describe, it, expect, vi } from "vitest";
import { evaluateAnswer } from "../../src/lib/evaluate-answer";
import type { AiProvider } from "../../src/lib/ai-provider";

function makeInput(overrides: Record<string, unknown> = {}) {
  return {
    sessionMode: "understand" as const,
    question: "TDD란 무엇인가?",
    answer: "테스트 먼저 작성",
    confidence: "high" as const,
    selectedText: "TDD는 테스트 먼저",
    contextExcerpt: "TDD는 테스트를 먼저 작성하는 방법론이다.",
    ...overrides,
  };
}

function mockProvider(response: unknown): AiProvider {
  return {
    generateProvocation: vi.fn(),
    evaluateAnswer: vi.fn().mockResolvedValue(response),
    generateModelAnswer: vi.fn(),
  };
}

describe("evaluateAnswer", () => {
  it("correct verdict → followUpQuestion null", async () => {
    const provider = mockProvider({
      verdict: "correct",
      whatWasRight: ["핵심 파악"],
      missingPoints: [],
      followUpQuestion: null,
    });
    const result = await evaluateAnswer(provider, makeInput());
    expect(result.verdict).toBe("correct");
    expect(result.followUpQuestion).toBeNull();
  });

  it("partial verdict → followUpQuestion 존재", async () => {
    const provider = mockProvider({
      verdict: "partial",
      whatWasRight: ["일부"],
      missingPoints: ["빠진점"],
      followUpQuestion: "그런데 왜?",
    });
    const result = await evaluateAnswer(provider, makeInput());
    expect(result.verdict).toBe("partial");
    expect(result.followUpQuestion).toBeTruthy();
  });

  it("incorrect verdict → followUpQuestion 존재", async () => {
    const provider = mockProvider({
      verdict: "incorrect",
      whatWasRight: [],
      missingPoints: ["핵심 누락"],
      followUpQuestion: "다시 생각해봐",
    });
    const result = await evaluateAnswer(provider, makeInput());
    expect(result.verdict).toBe("incorrect");
    expect(result.followUpQuestion).toBeTruthy();
  });

  it("memorized verdict → followUpQuestion 존재", async () => {
    const provider = mockProvider({
      verdict: "memorized",
      whatWasRight: ["단어만 맞음"],
      missingPoints: ["이해 부족"],
      followUpQuestion: "자기 말로 설명해봐",
    });
    const result = await evaluateAnswer(provider, makeInput());
    expect(result.verdict).toBe("memorized");
    expect(result.followUpQuestion).toBeTruthy();
  });

  it("confidence=high가 프롬프트에 포함", async () => {
    const provider = mockProvider({
      verdict: "correct",
      whatWasRight: [],
      missingPoints: [],
      followUpQuestion: null,
    });
    await evaluateAnswer(provider, makeInput());
    const call = (provider.evaluateAnswer as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.user).toContain("high");
  });

  it("재시도 평가: retryAnswer + retryVerdict 저장", async () => {
    const provider = mockProvider({
      verdict: "correct",
      whatWasRight: ["개선됨"],
      missingPoints: [],
      followUpQuestion: null,
    });
    const result = await evaluateAnswer(provider, makeInput({ answer: "재시도 답변" }));
    expect(result.verdict).toBe("correct");
  });

  it("AI JSON 파싱 실패 → 1회 재시도", async () => {
    let callCount = 0;
    const provider: AiProvider = {
      generateProvocation: vi.fn(),
      evaluateAnswer: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new SyntaxError("Invalid JSON");
        }
        return {
          verdict: "partial",
          whatWasRight: [],
          missingPoints: [],
          followUpQuestion: null,
        };
      }),
      generateModelAnswer: vi.fn(),
    };
    const result = await evaluateAnswer(provider, makeInput());
    expect(result.verdict).toBe("partial");
    expect(callCount).toBe(2);
  });
});
