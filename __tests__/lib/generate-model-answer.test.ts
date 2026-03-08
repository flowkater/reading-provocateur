import { describe, it, expect, vi } from "vitest";
import { generateModelAnswer } from "../../src/lib/generate-model-answer";
import type { AiProvider } from "../../src/lib/ai-provider";

function makeInput() {
  return {
    question: "TDD란?",
    answer: "테스트 먼저",
    contextExcerpt: "TDD는 테스트를 먼저 작성하는 방법론이다.",
    missingPoints: ["Red-Green-Refactor 사이클"],
  };
}

describe("generateModelAnswer", () => {
  it("질문 + 맥락 → 모범 답안 문자열 반환", async () => {
    const provider: AiProvider = {
      generateProvocation: vi.fn(),
      evaluateAnswer: vi.fn(),
      generateModelAnswer: vi.fn().mockResolvedValue(
        "TDD는 Red-Green-Refactor 사이클로 동작해. 먼저 실패하는 테스트를 작성하고, 최소한의 코드로 통과시킨 후 리팩터링하는 거야."
      ),
    };
    const result = await generateModelAnswer(provider, makeInput());
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("사용자 답변의 빠진 부분 중심 보충 확인", async () => {
    const provider: AiProvider = {
      generateProvocation: vi.fn(),
      evaluateAnswer: vi.fn(),
      generateModelAnswer: vi.fn().mockImplementation(async (input) => {
        expect(input.user).toContain("Red-Green-Refactor 사이클");
        return "모범 답안";
      }),
    };
    await generateModelAnswer(provider, makeInput());
  });

  it("3~5문장 길이 제한 (프롬프트 지시)", async () => {
    const provider: AiProvider = {
      generateProvocation: vi.fn(),
      evaluateAnswer: vi.fn(),
      generateModelAnswer: vi.fn().mockImplementation(async (input) => {
        expect(input.system).toContain("3~5문장");
        return "모범 답안 문장";
      }),
    };
    await generateModelAnswer(provider, makeInput());
  });

  it("API 에러 시 fallback 메시지 반환", async () => {
    const provider: AiProvider = {
      generateProvocation: vi.fn(),
      evaluateAnswer: vi.fn(),
      generateModelAnswer: vi.fn().mockRejectedValue(new Error("API Error")),
    };
    const result = await generateModelAnswer(provider, makeInput());
    expect(result).toBe("모범 답안을 생성할 수 없습니다.");
  });
});
