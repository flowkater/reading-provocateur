# Reading Provocateur — 구현 계획서

> 작성: FORGE ⚙️ | 날짜: 2026-03-08 (v2 — SA1/SA2 피드백 반영)
> 기반: `PRD.md` + `UI-Layout.md` + `design-system prompt.md`
> 방법론: **TDD (Red→Green→Refactor)**, 기능 단위 커밋
> 스택: Vite 6 + React 19 + TypeScript + Tailwind 4 + Vitest + Testing Library
> 목표: **2일 킬 패스 데모** — Error Loop + 모범 답안 포함

---

## 1. 기술 스택

| 구분 | 선택 | 버전 |
|------|------|------|
| 빌드 | Vite | 6.x |
| 프레임워크 | React 19 + TypeScript 5.7 | — |
| PDF | `@react-pdf-viewer/core` + `highlight` | 4.x |
| UI | shadcn/ui + Tailwind CSS 4 | — |
| AI | `@anthropic-ai/sdk` + AiProvider 추상화 | ^0.39 |
| 검증 | zod | ^3.24 |
| 저장 | localStorage (sessionStorage for API key) | — |
| 테스트 | Vitest + @testing-library/react + jsdom | — |
| Export | Blob + download | — |

### Tailwind v4 빌드 설정 (⚠️ v4는 PostCSS가 아닌 Vite 플러그인)
```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```
- ❌ `postcss`, `autoprefixer` devDependency 불필요
- ✅ `@tailwindcss/vite` 사용

### 디자인: Newsprint
- Playfair Display (헤드라인) / Lora (본문) / Inter (UI) / JetBrains Mono (데이터)
- `#F9F9F7` 배경, `#111111` 텍스트/보더, `#CC0000` 극소 강조
- border-radius: 0px 전체, hard offset shadow hover
- 하이라이트 색상: `rgba(254, 243, 199, 0.6)` (warm yellow)

### CORS 전략
- Day 1 첫 작업: `dangerouslyAllowBrowser: true`로 직접 호출 테스트
- 실패 → Vite dev proxy (`/api/anthropic`) 즉시 전환 (5분)
- 배포 시 → CF Worker proxy

### @react-pdf-viewer React 19 호환성 (⚠️ 리스크)
- Phase 1 시작 전 호환성 확인 필수
- 비호환 시 대안: `react-pdf` (더 가벼움, highlight 직접 구현) 또는 pdf.js 직접 사용
- Feature 6(셋업)에서 PoC 확인

---

## 2. 프로젝트 구조

```
reading-provocateur/
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── package.json
├── public/
│   └── sample.pdf              # 킬 테스트용 (소프트웨어 장인 발췌 or 영문 기술서)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── components/
│   │   ├── PdfViewer.tsx
│   │   ├── FileDropZone.tsx
│   │   ├── NavBar.tsx
│   │   ├── BottomBar.tsx
│   │   ├── FloatingToolbar.tsx     # 2-step: [🟡][💭] → "왜 여기서 묻길 원해?" + Intent chips
│   │   ├── SidePanel.tsx           # State machine (A→Loading→B→Evaluating→C→D→E)
│   │   ├── EmptyState.tsx          # + "도발해줘 💭" CTA + 페이지 기반 Intent chips
│   │   ├── LoadingCard.tsx
│   │   ├── ProvocationCard.tsx     # 질문 + 답변 + 확신도
│   │   ├── EvaluationCard.tsx      # 평가 + 후속 질문 + 재시도 + [정답 보기]
│   │   ├── ModelAnswerCard.tsx     # ★ 모범 답안 표시 (정답 보기 클릭 시)
│   │   ├── HistoryList.tsx         # 이전 도발 목록 + 클릭→페이지 점프
│   │   ├── SessionModeSelector.tsx # 온보딩 4모드 카드
│   │   ├── SettingsDialog.tsx
│   │   └── ExportPreview.tsx
│   │
│   ├── lib/
│   │   ├── ai-provider.ts          # AiProvider interface + AnthropicProvider
│   │   ├── generate-provocation.ts  # 도발 생성 (mode + intent, intent=null 경로 포함)
│   │   ├── evaluate-answer.ts       # 답변 평가 (verdict + followUp)
│   │   ├── generate-model-answer.ts # ★ 모범 답안 생성 (2차 실패 or 정답 보기)
│   │   ├── build-review-items.ts    # 약점 기록 생성
│   │   ├── extract-context.ts       # 선택 텍스트 ±800자 발췌
│   │   ├── prompts.ts               # 프롬프트 템플릿 (도발/평가/모범답안)
│   │   ├── store.ts                 # localStorage/sessionStorage CRUD
│   │   ├── export.ts                # 마크다운 생성 (Layer 1 + Layer 2 + Layer 3)
│   │   └── schemas.ts              # zod 스키마 (AI JSON 검증)
│   │
│   ├── hooks/
│   │   ├── useProvocationFlow.ts    # 도발→답변→평가→재시도→모범답안 상태 머신
│   │   ├── useSession.ts            # 세션 컨텍스트 (mode, book, 시간 추적)
│   │   ├── useSettings.ts           # 설정 로드/저장
│   │   └── useAnnotations.ts        # 하이라이트 CRUD + 복원
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── styles/
│       └── globals.css              # Newsprint 테마
│
├── __tests__/
│   ├── lib/
│   │   ├── generate-provocation.test.ts
│   │   ├── evaluate-answer.test.ts
│   │   ├── generate-model-answer.test.ts
│   │   ├── build-review-items.test.ts
│   │   ├── extract-context.test.ts
│   │   ├── store.test.ts
│   │   ├── export.test.ts
│   │   └── schemas.test.ts
│   ├── hooks/
│   │   ├── useProvocationFlow.test.ts
│   │   ├── useSession.test.ts
│   │   └── useSettings.test.ts
│   └── components/
│       ├── SidePanel.test.tsx
│       ├── FloatingToolbar.test.tsx
│       ├── ProvocationCard.test.tsx
│       ├── EvaluationCard.test.tsx
│       ├── ModelAnswerCard.test.tsx
│       ├── HistoryList.test.tsx
│       ├── SessionModeSelector.test.tsx
│       ├── ExportPreview.test.tsx
│       └── SettingsDialog.test.tsx
│
└── .env.example
```

### Vitest 설정
```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["__tests__/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

---

## 3. 데이터 모델

```typescript
// types/index.ts

// === Enums ===
export type SessionMode = "understand" | "apply" | "exam" | "critique";
export type HighlightIntent = "core" | "confused" | "connection" | "apply";
export type ProvocationKind = "recall" | "compression" | "misconception" | "challenge" | "transfer";
export type EvaluationVerdict = "correct" | "partial" | "incorrect" | "memorized";
export type ConfidenceLevel = "low" | "medium" | "high";

// === Side Panel State Machine (7 states, UI-Layout 6 + evaluating 분리) ===
export type SidePanelState =
  | "empty"       // State A: 빈 상태
  | "loading"     // State Loading: 도발 생성 대기
  | "question"    // State B: 질문 + 답변 + 확신도
  | "evaluating"  // 평가 API 호출 대기 (LoadingCard 재사용)
  | "evaluation"  // State C: 평가 결과 + 후속 질문 + 재시도
  | "modelAnswer" // ★ State C-2: 모범 답안 표시 ([정답 보기] or 2차 실패)
  | "saved";      // State E: 저장 완료 → 히스토리에 추가

// === Entities ===
export interface Book {
  id: string;
  fileName: string;
  totalPages: number;
  currentPage: number;
  addedAt: string;
}

export interface SessionContext {
  bookId: string;
  mode: SessionMode;
  startedAt: string;       // ISO
  endedAt: string | null;  // ★ 세션 종료 시각 (Export 소요 시간 계산용)
  firstPage: number;
  lastPage: number;
}

export interface Annotation {
  id: string;
  bookId: string;
  pageNumber: number;
  selectedText: string;
  highlightAreas: HighlightArea[];
  intent: HighlightIntent | null;
  createdAt: string;
}

export interface Provocation {
  id: string;
  bookId: string;
  annotationId: string | null;    // "도발해줘" 버튼 = null (페이지 기반)
  pageNumber: number;
  selectedText: string | null;    // 페이지 기반 도발이면 null
  contextExcerpt: string;
  sessionMode: SessionMode;
  intent: HighlightIntent | null; // 페이지 기반 도발도 intent 선택 필수
  kind: ProvocationKind;
  question: string;
  answer: string | null;
  confidence: ConfidenceLevel | null;
  createdAt: string;
  answeredAt: string | null;
  evaluation: Evaluation | null;
  modelAnswer: string | null;     // ★ 모범 답안 (2차 실패 or 정답 보기)
}

export interface Evaluation {
  verdict: EvaluationVerdict;
  whatWasRight: string[];
  missingPoints: string[];
  followUpQuestion: string | null;
  retryAnswer: string | null;
  retryVerdict: EvaluationVerdict | null;
  retryEvaluatedAt: string | null;
}

export interface ReviewItem {
  id: string;
  bookId: string;
  conceptLabel: string;
  sourceProvocationId: string;
  status: "weak" | "pending-review" | "resolved";
  reviewPrompt: string;
  createdAt: string;
}

export interface Settings {
  provider: "anthropic";
  apiKey: string;
  rememberKey: boolean;
  model: "claude-sonnet-4-6" | "claude-haiku-4-5";
  defaultMode: SessionMode;
  obsidianFrontmatter: boolean;
}
```

---

## 4. AI Provider 추상화 + 프롬프트 골격

### 4.1 Provider Interface

```typescript
interface AiProvider {
  generateProvocation(input: GenerateProvocationInput): Promise<ProvocationPayload>;
  evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluationPayload>;
  generateModelAnswer(input: ModelAnswerInput): Promise<string>;  // ★
}
```

### 4.2 도발 생성 프롬프트 골격

```typescript
// prompts.ts — generateProvocationPrompt

const SYSTEM = `당신은 Reading Provocateur입니다.
역할: 독자가 수동적으로 읽지 않고 능동적으로 사고하도록 도발.
규칙:
1. 답을 주지 말 것. 질문 1개만.
2. sessionMode + intent에 맞는 질문 종류(kind) 자동 선택.
3. 최근 질문과 중복 금지.
4. selectedText가 있으면 반드시 그 맥락에 anchor.
5. selectedText가 없으면 페이지 전체 맥락에서 핵심 포인트 선택.
6. 톤: 코치형 한국어 반말 — 직설적이되 격려적.
7. JSON으로만 응답: { "kind": "...", "question": "..." }`;

const USER = (input) => `
책: "${input.bookTitle}"
세션 모드: ${input.sessionMode}
의도(intent): ${input.intent ?? "없음 (페이지 전체 기반)"}

선택 텍스트: ${input.selectedText ?? "(없음)"}

맥락:
${input.contextExcerpt}

최근 질문 (중복 방지):
${input.recentProvocations.map(p => `- ${p.question}`).join("\n")}

현재 약점:
${input.recentWeakConcepts.join(", ") || "없음"}

JSON 응답:`;
```

### 4.3 답변 평가 프롬프트 골격

```typescript
const EVAL_SYSTEM = `당신은 Reading Provocateur의 평가 엔진입니다.
규칙:
1. 칭찬으로 시작하지 말 것.
2. 먼저 verdict (correct/partial/incorrect/memorized).
3. 정답 바로 주지 말 것.
4. 빈 요소 1~2개로 좁힐 것.
5. follow-up은 같은 빈틈을 다시 찌를 것.
6. JSON으로만 응답: { "verdict": "...", "whatWasRight": [...], "missingPoints": [...], "followUpQuestion": "..." | null }`;

const EVAL_USER = (input) => `
세션 모드: ${input.sessionMode}
질문: ${input.question}
답변: ${input.answer}
확신도: ${input.confidence}
선택 텍스트: ${input.selectedText ?? "(없음)"}
맥락: ${input.contextExcerpt}

JSON 응답:`;
```

### 4.4 모범 답안 프롬프트 골격

```typescript
const MODEL_ANSWER_SYSTEM = `당신은 Reading Provocateur의 모범 답안 제공자입니다.
규칙:
1. 간결하되 정확하게 (3~5문장).
2. 독자의 답변에서 빠진 부분을 중심으로 보충.
3. 톤: 코치형 한국어 반말.
4. 문자열로만 응답 (JSON 아님).`;
```

### 4.5 Intent=null 처리 (페이지 기반 도발)

- `selectedText=null`, `intent`는 사용자가 SidePanel 내에서 선택
- 프롬프트: "선택 텍스트: (없음)" → AI가 페이지 맥락에서 핵심 포인트 자동 선택
- kind 결정: `mode + intent` 매핑 동일 적용

### 4.6 JSON 파싱 재시도 전략

```typescript
async function parseAiJsonResponse<T>(
  rawText: string,
  schema: ZodSchema<T>,
  retryFn: () => Promise<string>
): Promise<T> {
  try {
    return schema.parse(JSON.parse(rawText));
  } catch {
    // 1회 재시도: system prompt 끝에 "반드시 유효한 JSON만 반환하세요" 추가
    const retryText = await retryFn();
    return schema.parse(JSON.parse(retryText)); // 2회 실패 시 throw
  }
}
```

---

## 5. TDD 테스트 계획

### 5.1 lib/ 유닛 테스트

#### `schemas.test.ts` (7)
```
✅ ProvocationPayload: valid JSON → 파싱 성공
✅ ProvocationPayload: kind 누락 → ZodError
✅ ProvocationPayload: 잘못된 kind 값 → ZodError
✅ EvaluationPayload: valid JSON → 파싱 성공
✅ EvaluationPayload: verdict 누락 → ZodError
✅ EvaluationPayload: followUpQuestion null 허용
✅ EvaluationPayload: missingPoints 빈 배열 허용 (correct 판정 시)
```

#### `extract-context.test.ts` (6)
```
✅ 선택 텍스트가 페이지 중간 → ±800자 추출
✅ 선택 텍스트가 페이지 시작 → 앞 0, 뒤 800자
✅ 선택 텍스트가 페이지 끝 → 앞 800자, 뒤 0
✅ 선택 텍스트를 페이지에서 못 찾으면 첫 1500자 fallback
✅ 페이지 텍스트 1500자 미만 → 전체 반환
✅ 선택 텍스트 null → 첫 1500자 반환 (페이지 기반 도발)
```

#### `generate-provocation.test.ts` (10)
```
✅ mode=understand + intent=core → recall/compression kind
✅ mode=critique + intent=confused → misconception kind
✅ mode=apply + intent=apply → transfer kind
✅ intent=null (페이지 기반) + mode=understand → AI가 kind 자동 선택
✅ intent=null + mode=exam → recall/challenge 경향
✅ recentProvocations 3개 → 프롬프트에 중복 방지 포함
✅ recentWeakConcepts → 프롬프트에 약점 연결 포함
✅ AI JSON 파싱 실패 → 1회 재시도 후 성공
✅ 2회 연속 파싱 실패 → Error throw
✅ 프롬프트에 bookTitle, sessionMode, intent, selectedText 포함 확인
```

#### `evaluate-answer.test.ts` (7)
```
✅ correct verdict → followUpQuestion null
✅ partial verdict → followUpQuestion 존재
✅ incorrect verdict → followUpQuestion 존재
✅ memorized verdict → followUpQuestion 존재
✅ confidence=high가 프롬프트에 포함
✅ 재시도 평가: retryAnswer + retryVerdict 저장
✅ AI JSON 파싱 실패 → 1회 재시도
```

#### `generate-model-answer.test.ts` (4) ★ NEW
```
✅ 질문 + 맥락 → 모범 답안 문자열 반환
✅ 사용자 답변의 빠진 부분 중심 보충 확인
✅ 3~5문장 길이 제한 (프롬프트 지시)
✅ API 에러 시 "모범 답안을 생성할 수 없습니다" fallback
```

#### `build-review-items.test.ts` (8)
```
✅ verdict=correct → ReviewItem 미생성
✅ verdict=partial → ReviewItem 1개 (status=weak)
✅ verdict=incorrect → ReviewItem 1개 (status=weak)
✅ verdict=memorized → ReviewItem 1개 (status=weak)
✅ verdict=correct + confidence=low → ReviewItem (pending-review)
✅ verdict=correct + confidence=high → ReviewItem 미생성
✅ conceptLabel이 missingPoints[0]에서 추출
✅ reviewPrompt에 빈틈 포인트 반영
```

#### `store.test.ts` (10)
```
✅ saveBook → getBooks
✅ saveAnnotation → getAnnotations(bookId) 필터링
✅ saveProvocation → getProvocations(bookId) 필터링
✅ saveReviewItem → getReviewItems(bookId) 필터링
✅ saveSettings: rememberKey=false → sessionStorage에 apiKey
✅ saveSettings: rememberKey=true → localStorage에 apiKey
✅ getSettings: sessionStorage 우선, localStorage fallback
✅ updateProvocation: 답변/평가/모범답안 업데이트
✅ saveSession → getSession(bookId): startedAt/endedAt 포함
✅ updateSession: endedAt + lastPage 업데이트
```

#### `export.test.ts` (13) ★ 확장
```
✅ 기본 Export: 제목 + 모드 + 날짜
✅ 도발 카드: 페이지, kind, intent, 질문, 답변, 확신도
✅ 평가: verdict 배지 + 빠진 점
✅ 재시도: retryAnswer + retryVerdict 포함
✅ 모범 답안: modelAnswer 있으면 별도 섹션 ★
✅ Layer 2 섹션: 사용자 답변만 추출한 노트 (AI 텍스트 미혼합) ★
✅ 약점 목록 섹션
✅ 리뷰 질문 섹션 (최대 5개)
✅ 세션 통계: 도발 수, 판정 분포, 확신도 분포, ⚡높은확신+틀림
✅ 세션 통계: 읽은 범위 (firstPage~lastPage) ★
✅ 세션 통계: 소요 시간 (endedAt - startedAt) ★
✅ obsidianFrontmatter=true → YAML 프론트매터 포함
✅ obsidianFrontmatter=false → 프론트매터 미포함
```

---

### 5.2 hooks/ 테스트

#### `useProvocationFlow.test.ts` (20) ★ 확장
```
✅ 초기 상태: state="empty"
✅ startProvocation(highlight) → state="loading"
✅ startProvocation(page-based, no highlight) → state="loading" ★
✅ loading 완료 → state="question", provocation 저장
✅ submitAnswer(answer, confidence) → state="evaluating"
✅ evaluating 완료(correct) → state="saved"
✅ evaluating 완료(partial) → state="evaluation", followUp 표시
✅ evaluating 완료(incorrect) → state="evaluation", followUp 표시
✅ evaluating 완료(memorized) → state="evaluation", followUp 표시
✅ submitRetry(retryAnswer) → state="evaluating"
✅ retry 평가 완료(correct) → state="saved"
✅ retry 평가 완료(partial/incorrect) → state="modelAnswer" ★ (2차 실패 → 모범 답안)
✅ skipRetry() → state="saved", 현재 verdict 유지
✅ showAnswer() → state="modelAnswer" ★ (모범 답안 생성 호출)
✅ modelAnswer 완료 → state="saved" ★
✅ 중복 방지: recentProvocations에 최근 3개 전달
✅ 약점 연결: recentWeakConcepts에 현재 책 약점 전달
✅ ReviewItem 자동 생성: partial/incorrect/memorized 시
✅ ReviewItem 자동 생성: correct + confidence=low 시
✅ 에러 발생 시 state 복원 + 에러 메시지 설정
```

#### `useSession.test.ts` (7) ★ 확장
```
✅ 초기: mode=null, book=null
✅ selectMode("understand") → mode 설정
✅ openBook(file) → book 생성 + localStorage 저장
✅ updatePage(47) → currentPage + lastPage 업데이트
✅ getSessionContext() → SessionContext 반환 (startedAt 포함)
✅ endSession() → endedAt 기록 ★
✅ getDuration() → 분 단위 소요 시간 계산 ★
```

#### `useSettings.test.ts` (5)
```
✅ 초기 로드: localStorage/sessionStorage에서 Settings 복원
✅ 저장: rememberKey=false → apiKey sessionStorage
✅ 저장: rememberKey=true → apiKey localStorage
✅ apiKey 빈값 → hasApiKey=false
✅ 모델 변경 → 즉시 반영
```

---

### 5.3 컴포넌트 테스트

#### `SessionModeSelector.test.tsx` (6) ★ 확장
```
✅ 4개 모드 카드 렌더링 (이해, 적용, 시험, 비판)
✅ 각 카드에 질문 종류 힌트 표시 (recall, compression 등)
✅ 모드 클릭 → onSelect 콜백 호출
✅ 선택된 모드: bg-[#111] text-[#F9F9F7] 반전 스타일
✅ 미선택: bg-[#F9F9F7] border-[#111]
✅ [샘플로 체험하기] 링크 클릭 → onSampleClick 콜백 ★
```

#### `FloatingToolbar.test.tsx` (7) ★ 확장
```
✅ Step 1: [🟡 Highlight] [💭 Provoke] 2버튼 렌더링
✅ Highlight 클릭 → onHighlight 콜백
✅ Provoke 클릭 → Step 2: "왜 여기서 묻길 원해?" 라벨 + Intent chips 전개 ★
✅ Step 2에서 Step 1 버튼 숨김 확인 ★
✅ Intent chip(핵심/헷갈림/연결/적용) 클릭 → onProvoke(intent) 콜백
✅ 외부 클릭 → 툴바 닫힘
✅ Newsprint 스타일: bg-[#111] text-[#F9F9F7] uppercase tracking-wider ★
```

#### `ProvocationCard.test.tsx` (9)
```
✅ 질문 표시: kind 라벨 (L3 · MISCONCEPTION) + mode + intent
✅ 페이지 번호 + 하이라이트 텍스트 표시
✅ 답변 textarea 렌더링
✅ 확신도 3칩 (낮음, 중간, 높음) 렌더링
✅ 확신도 선택 → 칩 반전 스타일 (bg-[#111] text-[#F9F9F7])
✅ 답변 비어있으면 [제출] disabled
✅ 확신도 미선택이면 [제출] disabled
✅ 답변 + 확신도 있으면 [제출] enabled
✅ [제출] 클릭 → onSubmit(answer, confidence)
```

#### `EvaluationCard.test.tsx` (13) ★ 확장
```
✅ verdict 배지 (✅ emerald / 🟡 amber / ❌ red / 📦 neutral)
✅ verdict=correct → [저장] primary CTA만 표시
✅ verdict=partial → [다시 답변] primary + [저장하고 넘어가기] secondary + [정답 보기] tertiary
✅ verdict=incorrect → [다시 답변] primary + [저장하고 넘어가기] + [정답 보기]
✅ verdict=memorized → [다시 답변] primary + [저장하고 넘어가기] + [정답 보기]
✅ whatWasRight 목록 표시
✅ missingPoints 목록 표시
✅ followUpQuestion 표시
✅ 재답변 textarea 렌더링
✅ [다시 답변] → onRetry(retryAnswer)
✅ [저장하고 넘어가기] → onSkip()
✅ [정답 보기] → onShowAnswer()
✅ State D (재시도 후): 1차 verdict + 재시도 verdict 둘 다 표시
```

#### `ModelAnswerCard.test.tsx` (3) ★ NEW
```
✅ 모범 답안 텍스트 표시
✅ 로딩 상태 표시 (모범 답안 생성 중)
✅ [저장하고 넘어가기] 버튼 → onSave() 콜백
```

#### `HistoryList.test.tsx` (5) ★ NEW
```
✅ 이전 도발 미니 카드 목록 렌더링 (kind + page + intent + verdict + confidence)
✅ 빈 목록 → 미표시
✅ 카드 클릭 → onPageJump(pageNumber) 콜백
✅ 최신 도발이 상단에 위치 (역순)
✅ Newsprint 미니 카드 스타일: border-neutral-300, hover:border-[#111]
```

#### `SidePanel.test.tsx` (11) ★ 확장
```
✅ state=empty → EmptyState 렌더링
✅ state=loading → LoadingCard 렌더링 (3-dot pulse)
✅ state=question → ProvocationCard 렌더링
✅ state=evaluating → LoadingCard 렌더링
✅ state=evaluation → EvaluationCard 렌더링
✅ state=modelAnswer → ModelAnswerCard 렌더링 ★
✅ state=saved → HistoryList에 카드 추가
✅ [도발해줘 💭] 버튼 state=empty에서 표시
✅ [도발해줘 💭] 버튼 state=question에서도 표시 (하단 고정) ★
✅ [도발해줘 💭] 클릭 → EmptyState 내 Intent chips 4종 표시 ★
✅ API Key 없으면 Settings Dialog 자동 오픈 ★
```

#### `ExportPreview.test.tsx` (9) ★ 확장
```
✅ 마크다운 프리뷰 렌더링
✅ Layer 2 섹션: 사용자 답변만 추출한 노트 ★
✅ 약점 목록 섹션
✅ 리뷰 질문 섹션
✅ 세션 통계: 도발 수 + 판정 분포
✅ 세션 통계: 읽은 범위 (p.38~47) ★
✅ 세션 통계: 소요 시간 (~25분) ★
✅ ⚡높은확신+틀림 카운트
✅ [다운로드 (.md)] → 다운로드 트리거
```

#### `SettingsDialog.test.tsx` (7) ★ 확장
```
✅ API Key 입력 필드 + 마스킹
✅ "이 기기에 기억" 토글 (기본 OFF)
✅ 모델 라디오 (Sonnet 4.6, Haiku 4.5)
✅ 기본 모드 select (이해/적용/시험/비판)
✅ Obsidian 프론트매터 토글
✅ [Done] → onSave 콜백
✅ Newsprint 입력 스타일: border-b-2 border-[#111] bg-transparent font-mono ★
```

---

### 5.4 테스트 요약

| 카테고리 | 파일 수 | 테스트 수 |
|----------|--------|----------|
| lib/ 유닛 | 8 | 65 |
| hooks/ | 3 | 32 |
| components/ | 9 | 70 |
| **합계** | **20** | **167** |

---

## 6. TDD 구현 순서 — Feature-wise

### Feature 1: 데이터 모델 + 스토어 + 스키마 (Day 1, 45분)

1. `types/index.ts` — 전체 타입 정의 (SessionContext.endedAt, Provocation.modelAnswer 포함)
2. `schemas.test.ts` → `schemas.ts` — 7개 테스트
3. `store.test.ts` → `store.ts` — 10개 테스트
4. 커밋: `feat: data model, zod schemas, localStorage store`

**DoD:**
- [ ] 14 interface/type 정의 완료
- [ ] zod 파싱 성공/실패 테스트 7/7
- [ ] store CRUD 테스트 10/10 (session 시간 추적 포함)

---

### Feature 2: 컨텍스트 추출 + 프롬프트 (Day 1, 30분)

1. `extract-context.test.ts` → `extract-context.ts` — 6개 테스트
2. `prompts.ts` — 도발/평가/모범답안 3종 프롬프트 (§4 골격 기반)

**DoD:**
- [ ] ±800자 추출 + null fallback 동작 (6/6)
- [ ] 프롬프트 3종 구현 (system+user 구조)
- [ ] intent=null 경로 프롬프트 분기

---

### Feature 3: AI Provider + 도발 생성 + 평가 + 모범답안 (Day 1, 1.5시간)

1. `ai-provider.ts` — AiProvider interface + AnthropicProvider
2. `generate-provocation.test.ts` → `generate-provocation.ts` — 10개 테스트
3. `evaluate-answer.test.ts` → `evaluate-answer.ts` — 7개 테스트
4. `generate-model-answer.test.ts` → `generate-model-answer.ts` — 4개 테스트 ★
5. 커밋: `feat: AI provider, provocation, evaluation, model answer`

**DoD:**
- [ ] AiProvider: 3 메서드 (generate, evaluate, modelAnswer)
- [ ] intent=null 경로 동작 확인
- [ ] JSON 파싱 재시도 동작
- [ ] 모범 답안 생성 + 에러 fallback
- [ ] 테스트 21/21

---

### Feature 4: 약점 기록 + Export (Day 1, 1시간)

1. `build-review-items.test.ts` → `build-review-items.ts` — 8개 테스트
2. `export.test.ts` → `export.ts` — 13개 테스트 (Layer 2 + 범위/시간 포함)
3. 커밋: `feat: review items, export with Layer 2 + session stats`

**DoD:**
- [ ] verdict별 ReviewItem 생성 규칙 동작 (8/8)
- [ ] Export Layer 1: 원시 로그 (도발+답변+평가+재시도+모범답안)
- [ ] Export Layer 2: 사용자 답변만 추출 (AI 미혼합) ★
- [ ] Export Layer 3: 약점 + 리뷰 질문 + 통계
- [ ] 통계: 판정 분포 + 확신도 분포 + ⚡높은확신+틀림 + 읽은 범위 + 소요 시간
- [ ] 테스트 21/21

---

### Feature 5: 핵심 상태 머신 Hook (Day 1, 1시간)

1. `useProvocationFlow.test.ts` → `useProvocationFlow.ts` — 20개 테스트
2. `useSession.test.ts` → `useSession.ts` — 7개 테스트
3. `useSettings.test.ts` → `useSettings.ts` — 5개 테스트
4. 커밋: `feat: provocation flow state machine, session (with time), settings`

**DoD:**
- [ ] 상태 전환 8종: empty→loading→question→evaluating→evaluation→retry→modelAnswer→saved
- [ ] 2차 실패 or [정답 보기] → modelAnswer 상태 + AI 호출
- [ ] 페이지 기반 도발 (no highlight) 경로 동작
- [ ] endSession() → 소요 시간 계산
- [ ] 에러 시 state 복원 + 에러 메시지
- [ ] 테스트 32/32

---

### Feature 6: 프로젝트 셋업 + Newsprint + CORS + PDF PoC (Day 1, 45분)

1. `create vite` + React + TS + `@tailwindcss/vite` + shadcn/ui
2. `globals.css` — Newsprint 폰트/색상/텍스처/유틸리티
3. CORS 확인: `dangerouslyAllowBrowser: true`
4. **@react-pdf-viewer React 19 호환성 PoC** ★
5. 커밋: `chore: project setup, Newsprint theme, CORS + PDF PoC`

**DoD:**
- [ ] `npm run dev` + `npm test` 동작
- [ ] Newsprint 폰트 4종 + 색상 3색 + border-radius 0
- [ ] Anthropic API 호출 성공 (또는 Vite proxy 전환 완료)
- [ ] react-pdf-viewer로 PDF 렌더링 확인 (비호환 시 대안 전환)

---

### Feature 7: 온보딩 + 세션 모드 (Day 1, 30분)

1. `SessionModeSelector.test.tsx` → `SessionModeSelector.tsx` — 6개 테스트
2. `FileDropZone.tsx` — PDF 열기 + 드래그 + 샘플
3. `App.tsx` — 온보딩 ↔ 메인 전환 + API Key 없으면 Settings 자동 오픈
4. 커밋: `feat: onboarding, session mode, file drop, auto settings`

**DoD:**
- [ ] 4모드 카드 + Newsprint 반전 스타일
- [ ] [샘플로 체험하기] → sample.pdf 로드
- [ ] API Key 없으면 Settings Dialog 자동 오픈
- [ ] 테스트 6/6

---

### Feature 8: 메인 레이아웃 + PDF 뷰어 (Day 1, 30분)

1. `NavBar.tsx` — 모드 배지 포함
2. `BottomBar.tsx` — p.N/M + 진행률 %
3. `PdfViewer.tsx` — highlight plugin + 하이라이트 복원
4. 커밋: `feat: main layout, PDF viewer with highlight restore`

**DoD:**
- [ ] 70:30 Split, NavBar(모드 배지), BottomBar(진행률)
- [ ] 저장된 하이라이트 복원 렌더링 (`renderHighlights`)
- [ ] PDF 페이지 이동

---

### Feature 9: FloatingToolbar + Intent (Day 2, 30분)

1. `FloatingToolbar.test.tsx` → `FloatingToolbar.tsx` — 7개 테스트
2. highlight plugin `renderHighlightTarget` 연결
3. 커밋: `feat: floating toolbar 2-step, intent chips`

**DoD:**
- [ ] Step 1: [🟡] [💭] → Step 2: "왜 여기서 묻길 원해?" + 4칩
- [ ] Intent 선택 → SidePanel loading 전환
- [ ] Newsprint 스타일 적용
- [ ] 테스트 7/7

---

### Feature 10: SidePanel + ProvocationCard (Day 2, 45분)

1. `ProvocationCard.test.tsx` → `ProvocationCard.tsx` — 9개 테스트
2. `SidePanel.test.tsx` → `SidePanel.tsx` — 11개 테스트
3. `EmptyState.tsx` (페이지 기반 Intent chips 포함), `LoadingCard.tsx`
4. 커밋: `feat: side panel 8-state, provocation card, page-based provoke`

**DoD:**
- [ ] 8 state 전환 모두 동작
- [ ] 페이지 기반 "도발해줘" → SidePanel 내 Intent chips 표시
- [ ] 답변 + 확신도 validation
- [ ] [도발해줘 💭] 하단 고정 (state=empty, question, saved)
- [ ] API Key 없으면 Settings 자동 오픈
- [ ] 테스트 20/20

---

### Feature 11: EvaluationCard + ModelAnswer + Error Loop (Day 2, 1시간)

1. `EvaluationCard.test.tsx` → `EvaluationCard.tsx` — 13개 테스트
2. `ModelAnswerCard.test.tsx` → `ModelAnswerCard.tsx` — 3개 테스트
3. 전체 Error Loop 통합
4. 커밋: `feat: evaluation, model answer, error loop complete`

**DoD:**
- [ ] verdict 4배지 + 색상 정확
- [ ] CTA: correct → [저장], 나머지 → [다시 답변] primary
- [ ] 2차 실패 or [정답 보기] → 모범 답안 생성 + 표시
- [ ] State C → retry → C-2(modelAnswer) or saved 전환
- [ ] 테스트 16/16

---

### Feature 12: History + Settings + Export (Day 2, 1시간)

1. `HistoryList.test.tsx` → `HistoryList.tsx` — 5개 테스트
2. `SettingsDialog.test.tsx` → `SettingsDialog.tsx` — 7개 테스트
3. `ExportPreview.test.tsx` → `ExportPreview.tsx` — 9개 테스트
4. 커밋: `feat: history (page jump), settings, export (Layer 2 + stats)`

**DoD:**
- [ ] 히스토리 미니 카드 + 클릭 → 페이지 점프
- [ ] Settings: Newsprint input 스타일
- [ ] Export: Layer 1 + Layer 2(사용자 답변만) + Layer 3(약점/리뷰) + 통계(범위/시간)
- [ ] 테스트 21/21

---

### Feature 13: 에러 핸들링 + UI 폴리싱 + 킬 테스트 (Day 2, 30분)

1. 에러 시나리오별 UX:
   - API Key 무효 → "API Key가 올바르지 않습니다. Settings에서 확인하세요." + Settings 오픈
   - Rate limit → "잠시 후 다시 시도하세요. (N초 후 재시도)"
   - 네트워크 오류 → "네트워크 연결을 확인하세요." + [재시도] 버튼
   - 토큰 초과 → 컨텍스트 축소 후 자동 재시도
2. LoadingCard 3-dot pulse
3. 반응형: 1024px+ 70:30, 768~1024 60:40 (모바일 bottom sheet는 Phase 3)
4. 커밋: `polish: error handling, loading, responsive`

**DoD:**
- [ ] 에러 시나리오 4종 각각 사용자 친화 메시지
- [ ] 로딩 pulse 동작
- [ ] 태블릿 60:40 반응형

---

## 7. 킬 테스트 시나리오 (1분 30초)

```
0:00  앱 열기
0:05  세션 모드 = 이해 선택
0:08  API Key 없으면 → Settings 자동 오픈 → Key 입력 → Done
0:15  [샘플로 체험하기] → PDF 로드
0:20  텍스트 드래그 선택
0:23  FloatingToolbar → [💭 Provoke]
0:25  "왜 여기서 묻길 원해?" → [헷갈림] 선택
0:28  SidePanel: Loading → 질문 카드 (L3 Misconception)
0:35  답변 입력 + 확신도 [높음] 선택
0:42  [제출]
0:45  Loading → 평가: 🟡 부분적
      ✓ 맞은 점 / ✗ 빠진 점 / 후속 질문
0:55  재답변 입력
0:58  [다시 답변]
1:02  최종: ✅ 정확 → [저장]
1:05  이전 도발 히스토리에 카드 추가
1:10  [📥 Export]
1:15  프리뷰: Layer 2(내 답변) + 약점 + 리뷰 질문 + ⚡착각 0건 + p.38~47 + ~10분
1:20  [다운로드 (.md)] → 파일 확인
1:25  ✅ 데모 완료
```

**무중단 재현 3회** = 킬 패스 성공

---

## 8. 전체 DoD (Phase 1 완료 기준)

### 기능 DoD (12항목)

| # | 기능 | DoD |
|---|------|-----|
| 1 | PDF 열기 | 파일/드래그/샘플 → 렌더링 + 페이지 이동 + 하이라이트 복원 |
| 2 | 세션 모드 | 4종 선택 → 배지 + 질문 생성 반영 |
| 3 | 하이라이트 + Intent | FloatingToolbar 2-step → Intent 4칩 → kind 변화 |
| 4 | 페이지 기반 도발 | "도발해줘 💭" → SidePanel 내 Intent 선택 → 도발 생성 ★ |
| 5 | 컨텍스트 추출 | ±800자 + null fallback |
| 6 | 도발 생성 | mode+intent → kind 자동 + JSON 파싱 + 재시도 |
| 7 | 답변 + 확신도 | textarea + 3칩 + 둘 다 있어야 제출 |
| 8 | 평가 + Error Loop | verdict 4분류 + followUp + 재답변 1회 |
| 9 | 모범 답안 | 2차 실패 or [정답 보기] → AI 생성 + 표시 ★ |
| 10 | 약점 기록 | partial/incorrect/memorized + correct+low → ReviewItem |
| 11 | Export | Layer 1 + **Layer 2(사용자 답변만)** + Layer 3(약점/리뷰) + 통계(범위/시간) ★ |
| 12 | Settings | API Key(session 기본) + 모델 + 기본 모드 + Obsidian |

### 품질 DoD

| 항목 | 기준 |
|------|------|
| 테스트 | **167/167 통과** (lib 65 + hooks 32 + components 70) |
| 커버리지 | lib/ 90%+, hooks/ 85%+ |
| 타입 | `tsc --noEmit` 에러 0 |
| 킬 테스트 | 1분 30초 시나리오 **3회 무중단 재현** |
| 디자인 | Newsprint 톤 일관 (radius 0, 폰트 4종, 색상 3색, hard shadow) |
| 에러 UX | API Key 무효/rate limit/네트워크/토큰 초과 4종 메시지 |

### 명시적 Phase 3 이후 항목
- ❌ 모바일 bottom sheet 반응형 (Phase 3)
- ❌ 다크모드 (Phase 3)
- ❌ [다른 도발] 버튼 (Phase 2)
- ❌ 챕터 감지 (Phase 2 TOC)
- ❌ 다중 하이라이트 색상 (Phase 3)
- ❌ 라이브러리/통계 (Phase 3+)

---

## 9. 의존성

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "@react-pdf-viewer/core": "^4.1.0",
    "@react-pdf-viewer/highlight": "^4.1.0",
    "pdfjs-dist": "^4.9.155",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "uuid": "^11.1.0",
    "zod": "^3.24.0",
    "lucide-react": "^0.474.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

> ⚠️ `@react-pdf-viewer/default-layout` 제거 (불필요 — 커스텀 NavBar/BottomBar 사용)
> ⚠️ `postcss`, `autoprefixer` 제거 (Tailwind v4는 Vite 플러그인)

---

## 10. 리스크 & 대응

| 리스크 | 확률 | 대응 |
|--------|------|------|
| **CORS 차단** | 중~높 | Day 1 F6에서 확인 → Vite proxy 즉시 전환 |
| **react-pdf-viewer React 19 비호환** | 중 | F6 PoC → 대안: `react-pdf` 또는 pdf.js 직접 |
| **AI 평가 부정확** | 중 | zod 강제 + 프롬프트 엄격화 + JSON 재시도 |
| **API Key 무효/rate limit** | 중 | 4종 에러 시나리오별 UX (F13) |
| **한국어 PDF 텍스트 레이어** | 중 | 영어 sample.pdf로 데모 |
| **테스트 167개 작성 시간** | 중~높 | lib/ 먼저 (TDD), 컴포넌트는 핵심 인터랙션 집중 |
| **localStorage 5MB** | 낮 | excerpt만 저장, PDF 미저장 |

---

## 11. SA1/SA2 피드백 반영 요약

### SA1 (PRD 갭) — 6건 반영

| # | 피드백 | 반영 |
|---|--------|------|
| M1 | 모범 답안 AI 호출 누락 | `generate-model-answer.ts` + `ModelAnswerCard.tsx` + state "modelAnswer" 추가 |
| M2 | 페이지 기반 도발 플로우 누락 | intent=null 경로 테스트 + EmptyState 내 Intent chips + 프롬프트 분기 |
| M3 | Layer 2 (사용자 답변만) Export 누락 | export.ts Layer 2 섹션 + 테스트 추가 |
| M4 | Export 읽은 범위 + 소요 시간 누락 | SessionContext.endedAt + useSession.endSession/getDuration + export 통계 |
| M5 | [정답 보기] UI State 없음 | SidePanelState "modelAnswer" + ModelAnswerCard 컴포넌트 |
| W3 | Tailwind v4 빌드 설정 오류 | `@tailwindcss/vite` 사용, postcss/autoprefixer 제거 |

### SA2 (UI-Layout 갭) — 7건 반영

| # | 피드백 | 반영 |
|---|--------|------|
| 1 | FloatingToolbar "왜 여기서 묻길 원해?" 라벨 테스트 없음 | 테스트 추가 (Step 2 라벨 + Step 1 숨김) |
| 2 | "도발해줘" SidePanel 내 Intent chips 경로 없음 | EmptyState 내 Intent chips + SidePanel 테스트 추가 |
| 3 | HistoryList.test.tsx 파일 없음 | 테스트 파일 + 5개 테스트 추가 |
| 5 | API Key 없을 때 Settings 자동 오픈 테스트 없음 | SidePanel 테스트에 추가 |
| 6 | 모바일 bottom sheet | Phase 3 명시적 제외 항목으로 문서화 |
| 7 | 하이라이트 복원 누락 | Feature 8 DoD + useAnnotations hook |
| 10 | 세션 시간 추적 없음 | SessionContext.endedAt + endSession() + getDuration() |

### 추가 보강 (WK 항목)
- WK1: 프롬프트 골격 3종 (도발/평가/모범답안) 추가 (§4)
- WK2: intent=null 처리 가이드라인 추가
- WK3: JSON 파싱 재시도 구현 코드 추가
- WK4: 에러 시나리오 4종 UX 명시 (F13)
- WK5: 하이라이트 복원 (F8 DoD)
- W2: `@react-pdf-viewer/default-layout` 제거

---

## 12. Phase 로드맵 (참고)

| Phase | 핵심 | 기간 |
|-------|------|------|
| **P1** | 킬 패스 — Error Loop + 모범 답안 + Layer 2 Export (이 문서) | 2일 |
| P1.5 | 챕터 검증, Interruption Budget, scaffolding | 1주 |
| P2 | 리뷰 카드, 책 메모리, 히스토리 탭, [다른 도발], IndexedDB | 2~3주 |
| P3 | TOC, 검색, 다크모드, 4색 하이라이트, 모바일 bottom sheet | 2~3주 |
| P4 | 라이브러리, 톤 설정, 통계, Todait 연동 | 1~2주 |

---

*FORGE ⚙️ — 2026-03-08 v2 | SA1/SA2 피드백 반영 | TDD 167 tests*
