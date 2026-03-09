import type { SessionMode, HighlightIntent } from "../types";

// === 도발 생성 프롬프트 ===

const PROVOCATION_SYSTEM = `당신은 Reading Provocateur입니다.
역할: 독자가 수동적으로 읽지 않고 능동적으로 사고하도록 도발.
규칙:
1. 답을 주지 말 것. 질문 1개만.
2. sessionMode + intent에 맞는 질문 종류(kind) 자동 선택.
   kind는 아래 5개 중 정확히 하나만 사용할 것:
   - recall: 기억/설명 확인
   - compression: 핵심 요약/압축
   - misconception: 오개념/혼동 찌르기
   - challenge: 반박/비판적 검토
   - transfer: 적용/전이
3. 최근 질문과 중복 금지.
4. selectedText가 있으면 반드시 그 맥락에 anchor.
5. selectedText가 없으면 페이지 전체 맥락에서 핵심 포인트 선택.
6. 톤: 코치형 한국어 반말 — 직설적이되 격려적.
7. JSON으로만 응답: { "kind": "recall|compression|misconception|challenge|transfer", "question": "..." }`;

export interface ProvocationPromptInput {
  bookTitle: string;
  sessionMode: SessionMode;
  intent: HighlightIntent | null;
  selectedText: string | null;
  contextExcerpt: string;
  recentProvocations: { question: string }[];
  recentWeakConcepts: string[];
}

export function buildProvocationPrompt(input: ProvocationPromptInput): {
  system: string;
  user: string;
} {
  const user = `책: "${input.bookTitle}"
세션 모드: ${input.sessionMode}
의도(intent): ${input.intent ?? "없음 (페이지 전체 기반)"}

선택 텍스트: ${input.selectedText ?? "(없음)"}

맥락:
${input.contextExcerpt}

최근 질문 (중복 방지):
${input.recentProvocations.map((p) => `- ${p.question}`).join("\n") || "없음"}

현재 약점:
${input.recentWeakConcepts.join(", ") || "없음"}

JSON 응답:`;

  return { system: PROVOCATION_SYSTEM, user };
}

// === 답변 평가 프롬프트 ===

const EVALUATION_SYSTEM = `당신은 Reading Provocateur의 평가 엔진입니다.
규칙:
1. 칭찬으로 시작하지 말 것.
2. 먼저 verdict (correct/partial/incorrect/memorized).
3. 정답 바로 주지 말 것.
4. 빈 요소 1~2개로 좁힐 것.
5. follow-up은 같은 빈틈을 다시 찌를 것.
6. JSON으로만 응답: { "verdict": "...", "whatWasRight": [...], "missingPoints": [...], "followUpQuestion": "..." | null }`;

export interface EvaluationPromptInput {
  sessionMode: SessionMode;
  question: string;
  answer: string;
  confidence: string;
  selectedText: string | null;
  contextExcerpt: string;
}

export function buildEvaluationPrompt(input: EvaluationPromptInput): {
  system: string;
  user: string;
} {
  const user = `세션 모드: ${input.sessionMode}
질문: ${input.question}
답변: ${input.answer}
확신도: ${input.confidence}
선택 텍스트: ${input.selectedText ?? "(없음)"}
맥락: ${input.contextExcerpt}

JSON 응답:`;

  return { system: EVALUATION_SYSTEM, user };
}

// === 모범 답안 프롬프트 ===

const MODEL_ANSWER_SYSTEM = `당신은 Reading Provocateur의 모범 답안 제공자입니다.
규칙:
1. 간결하되 정확하게 (3~5문장).
2. 독자의 답변에서 빠진 부분을 중심으로 보충.
3. 톤: 코치형 한국어 반말.
4. 문자열로만 응답 (JSON 아님).`;

export interface ModelAnswerPromptInput {
  question: string;
  answer: string;
  contextExcerpt: string;
  missingPoints: string[];
}

export function buildModelAnswerPrompt(input: ModelAnswerPromptInput): {
  system: string;
  user: string;
} {
  const user = `질문: ${input.question}
사용자 답변: ${input.answer}
맥락: ${input.contextExcerpt}
빠진 점: ${input.missingPoints.join(", ") || "없음"}

모범 답안:`;

  return { system: MODEL_ANSWER_SYSTEM, user };
}
