import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateProvocation } from "../../src/lib/generate-provocation";
import type { AiProvider } from "../../src/lib/ai-provider";
import type { SessionMode, HighlightIntent } from "../../src/types";

function makeInput(overrides: Record<string, unknown> = {}) {
  return {
    bookTitle: "소프트웨어 장인",
    sessionMode: "understand" as SessionMode,
    intent: "core" as HighlightIntent | null,
    selectedText: "TDD는 테스트 먼저 작성한다",
    contextExcerpt: "TDD는 테스트를 먼저 작성하고 코드를 작성하는 방법론이다.",
    pageText: "전체 페이지 텍스트",
    pageNumber: 42,
    recentProvocations: [] as { question: string }[],
    recentWeakConcepts: [] as string[],
    ...overrides,
  };
}

function mockProvider(
  response: unknown,
  failFirst = false
): AiProvider {
  let callCount = 0;
  return {
    generateProvocation: vi.fn().mockImplementation(async () => {
      callCount++;
      if (failFirst && callCount === 1) {
        return { kind: "recall", question: "질문?" }; // valid — test checks prompt content
      }
      return response;
    }),
    evaluateAnswer: vi.fn(),
    generateModelAnswer: vi.fn(),
  };
}

describe("generateProvocation", () => {
  it("mode=understand + intent=core → provocation 생성", async () => {
    const provider = mockProvider({ kind: "recall", question: "이 개념 설명해봐" });
    const result = await generateProvocation(provider, makeInput());
    expect(result.kind).toBe("recall");
    expect(result.question).toBeTruthy();
  });

  it("mode=critique + intent=confused → provocation 생성", async () => {
    const provider = mockProvider({ kind: "misconception", question: "정말 그렇게 생각해?" });
    const result = await generateProvocation(
      provider,
      makeInput({ sessionMode: "critique", intent: "confused" })
    );
    expect(result.kind).toBe("misconception");
  });

  it("mode=apply + intent=apply → provocation 생성", async () => {
    const provider = mockProvider({ kind: "transfer", question: "어디에 적용?" });
    const result = await generateProvocation(
      provider,
      makeInput({ sessionMode: "apply", intent: "apply" })
    );
    expect(result.kind).toBe("transfer");
  });

  it("intent=null (페이지 기반) + mode=understand → AI가 kind 자동 선택", async () => {
    const provider = mockProvider({ kind: "compression", question: "요약해봐" });
    const result = await generateProvocation(
      provider,
      makeInput({ intent: null, selectedText: null })
    );
    expect(result.kind).toBeDefined();
  });

  it("intent=null + mode=exam → provocation 생성", async () => {
    const provider = mockProvider({ kind: "recall", question: "기억나?" });
    const result = await generateProvocation(
      provider,
      makeInput({ intent: null, selectedText: null, sessionMode: "exam" })
    );
    expect(result.kind).toBeDefined();
  });

  it("recentProvocations 3개 → 프롬프트에 중복 방지 포함", async () => {
    const provider = mockProvider({ kind: "recall", question: "새 질문" });
    await generateProvocation(
      provider,
      makeInput({
        recentProvocations: [
          { question: "질문1" },
          { question: "질문2" },
          { question: "질문3" },
        ],
      })
    );
    const call = (provider.generateProvocation as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.user).toContain("질문1");
    expect(call.user).toContain("질문2");
    expect(call.user).toContain("질문3");
  });

  it("recentWeakConcepts → 프롬프트에 약점 연결 포함", async () => {
    const provider = mockProvider({ kind: "recall", question: "약점 질문" });
    await generateProvocation(
      provider,
      makeInput({ recentWeakConcepts: ["DI 개념", "SOLID"] })
    );
    const call = (provider.generateProvocation as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.user).toContain("DI 개념");
    expect(call.user).toContain("SOLID");
  });

  it("AI JSON 파싱 실패 → 1회 재시도 후 성공", async () => {
    let callCount = 0;
    const provider: AiProvider = {
      generateProvocation: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new SyntaxError("Invalid JSON");
        }
        return { kind: "recall", question: "재시도 성공" };
      }),
      evaluateAnswer: vi.fn(),
      generateModelAnswer: vi.fn(),
    };
    const result = await generateProvocation(provider, makeInput());
    expect(result.question).toBe("재시도 성공");
    expect(callCount).toBe(2);
  });

  it("2회 연속 파싱 실패 → Error throw", async () => {
    const provider: AiProvider = {
      generateProvocation: vi.fn().mockRejectedValue(new SyntaxError("Invalid JSON")),
      evaluateAnswer: vi.fn(),
      generateModelAnswer: vi.fn(),
    };
    await expect(generateProvocation(provider, makeInput())).rejects.toThrow();
  });

  it("프롬프트에 bookTitle, sessionMode, intent, selectedText 포함 확인", async () => {
    const provider = mockProvider({ kind: "recall", question: "질문" });
    await generateProvocation(provider, makeInput());
    const call = (provider.generateProvocation as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.user).toContain("소프트웨어 장인");
    expect(call.user).toContain("understand");
    expect(call.user).toContain("core");
    expect(call.user).toContain("TDD는 테스트 먼저 작성한다");
  });
});
