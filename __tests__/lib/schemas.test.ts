import { describe, it, expect } from "vitest";
import { ProvocationPayloadSchema, EvaluationPayloadSchema } from "../../src/lib/schemas";

describe("ProvocationPayloadSchema", () => {
  it("valid JSON → 파싱 성공", () => {
    const valid = { kind: "recall", question: "이 개념을 설명해봐" };
    expect(ProvocationPayloadSchema.parse(valid)).toEqual(valid);
  });

  it("kind 누락 → ZodError", () => {
    expect(() =>
      ProvocationPayloadSchema.parse({ question: "질문" })
    ).toThrow();
  });

  it("잘못된 kind 값 → ZodError", () => {
    expect(() =>
      ProvocationPayloadSchema.parse({ kind: "invalid", question: "질문" })
    ).toThrow();
  });
});

describe("EvaluationPayloadSchema", () => {
  it("valid JSON → 파싱 성공", () => {
    const valid = {
      verdict: "correct",
      whatWasRight: ["핵심 파악"],
      missingPoints: [],
      followUpQuestion: null,
    };
    expect(EvaluationPayloadSchema.parse(valid)).toEqual(valid);
  });

  it("verdict 누락 → ZodError", () => {
    expect(() =>
      EvaluationPayloadSchema.parse({
        whatWasRight: [],
        missingPoints: [],
        followUpQuestion: null,
      })
    ).toThrow();
  });

  it("followUpQuestion null 허용", () => {
    const valid = {
      verdict: "partial",
      whatWasRight: ["일부 맞음"],
      missingPoints: ["빠진 점"],
      followUpQuestion: null,
    };
    expect(EvaluationPayloadSchema.parse(valid)).toEqual(valid);
  });

  it("missingPoints 빈 배열 허용 (correct 판정 시)", () => {
    const valid = {
      verdict: "correct",
      whatWasRight: ["모두 맞음"],
      missingPoints: [],
      followUpQuestion: null,
    };
    expect(EvaluationPayloadSchema.parse(valid)).toEqual(valid);
  });
});
