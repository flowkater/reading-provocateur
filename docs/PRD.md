---
tags:
  - 주제/RP
  - 타입/PRD
  - 상태/현행
created: 2026-03-08
updated: 2026-03-08
design-system: Newsprint (designprompts.dev/newsprint)
stack: Vite + React 19 + TypeScript + Tailwind
references:
  - "[[design-system prompt]]"
  - "[[legacy/rp-concept-v2-learning-first]]"
  - "[[legacy/rp-feedback-summary-2026-03-08]]"
  - "[[legacy/rp-implementation-plan-v4-learning-first]]"
  - "[[legacy/concept]]"
  - "[[legacy/implementation-plan-web]]"
  - "[[legacy/Reading Provocateur - v1 UI Layout 상세 설계 (2026-03-08)]]"
---

# Reading Provocateur — PRD (Product Requirements Document)

> **한 줄 정의**: 읽는 동안 AI가 인출을 요구하고, 오류를 진단하고, 재시도시켜서
> 읽기를 **실제 학습**으로 바꾸는 재시도 엔진.
>
> _"이 제품은 '질문 잘하는 리더'가 아니라,_
> _읽은 것을 진짜 남게 만드는 **재시도 엔진**이다."_

---

## 1. 문제 정의

### 사용자가 겪는 진짜 실패
1. **읽을 때는 이해한 것 같지만 덮으면 설명이 안 된다** (false fluency)
2. **하이라이트는 남는데, 무엇을 왜 표시했는지 사라진다**
3. **요약을 읽으면 안 것 같지만 내 사고 구조는 바뀌지 않는다**
4. **틀린 이해를 바로잡는 루프가 없다**
5. **다음 날 다시 꺼내보는 장치가 없어 기억이 증발한다**

핵심 문제 = **이해 착각 + 오류 방치 + 지연 회상 부재**

---

## 2. 제품 원칙

### P1. AI는 답보다 먼저 인출을 요구한다
먼저 묻고 → 사용자가 답하고 → 어디가 비었는지 짚는다.
정답/모범답안은 마지막 단계에서만.

### P2. 질문은 "재미"보다 학습 기능이 있어야 한다
모든 질문은 반드시 아래 중 하나를 해야 한다:
- 기억 인출 / 개념 압축 / 오해 드러내기 / 반례 시험 / 전이·종합

### P3. Error Loop는 옵션이 아니라 핵심 엔진이다
`질문 → 답 → 판정 → 빈틈 설명 → 후속 질문 → 재답변 → (필요 시 모범 답안)`

### P4. 요약보다 먼저 멘탈 모델을 건드린다
- 이 장이 바꾸려는 직관
- 핵심 개념 간 관계
- 혼동하기 쉬운 개념쌍
- 저자의 핵심 가정

### P5. 학습은 다음 세션 시작에서 완성된다
"오늘 읽기"만이 아니라 **다음 세션 시작 60초 복습**이 제품 가치.

### P6. 톤은 코치형
- 날카로운 사고 자극 ≠ 공격적 말투
- 도발은 인지적 도전이지, UX적 거슬림이 아니다
- 한국어 반말, 직설적이되 격려적. "좋아, 근데 여기 빠졌어."

### P7. 사용자 말과 AI 말은 섞지 않는다
최종 노트 = 사용자 원문 + AI 진단(별도) + 리뷰 큐(별도)

---

## 3. 타겟 유저

### 1차 타겟 (좁힘)
- **개념 밀도 높은 논픽션** 독자
- **개발/기술 서적** 독자
- **교재/전문서** 학습자
- "읽고 끝"이 아니라 **이해/적용/시험**이 중요한 독서

### 비우는 영역
- 소설/에세이 감상 독서
- 가볍게 훑는 기사 소비

---

## 4. 핵심 학습 루프

```
세션 시작 → (리뷰 카드: 어제 약점, Phase 2)
→ 세션 모드 선택
→ PDF 열기/읽기
→ 텍스트 선택 + 의도(intent) 선택
→ AI 도발 생성 (mode + intent 기반)
→ 답변 입력 + 확신도 선택
→ AI 평가 (verdict + 빈틈 + 후속 질문)
→ 재시도 1회
→ 약점 기록
→ 세션 종료 → Export (노트 + 약점 + 리뷰 질문)
→ (다음 세션 시작에서 지연 회상, Phase 2)
```

---

## 5. 세션 모드 (4종)

세션 시작 시 선택. 같은 페이지라도 목적이 다르면 질문이 달라진다.

| 모드 | 목적 | 질문 경향 |
|------|------|----------|
| **이해** | 핵심 개념을 내 말로 설명 | recall, compression, misconception |
| **적용** | 내 프로젝트/업무/삶과 연결 | transfer, connection |
| **시험** | 기억/비교/반례 중심 | recall, challenge, counterexample |
| **비판** | 가정, 약점, 반론 | challenge, misconception, synthesis |

세션별 상태 (책별 고정 아님).

---

## 6. 하이라이트 의도 (Intent, 4종)

텍스트 선택 → Provoke 클릭 시 의도 칩 표시:

| Intent | 의미 | 질문 매핑 |
|--------|------|----------|
| **핵심** | 중요하다고 느꼈다 | recall, compression |
| **헷갈림** | 이해가 안 갔다 | misconception, error loop 강화 |
| **연결** | 내 경험/지식과 닿는다 | connection, transfer |
| **적용** | 써먹어보고 싶다 | transfer, synthesis |

> "무엇을 표시했는가"보다 **"왜 거기서 멈췄는가"**를 알아야 질문이 좋아진다.

---

## 7. 도발 Taxonomy (기능 중심, 5종)

| Level | 이름 | 목적 | 예시 |
|-------|------|------|------|
| L1 | **Recall** | 방금 읽은 내용 인출 | "방금 문단 핵심을 한 줄로 말해봐." |
| L2 | **Compression** | 내 말로 압축/재구성 | "이 개념을 초등학생도 이해하게 설명해봐." |
| L3 | **Misconception Probe** | 틀리기 쉬운 지점 드러내기 | "많이들 여기서 뭐랑 헷갈릴 것 같아?" |
| L4 | **Challenge** | 가정과 약점 시험 | "이 주장이 틀릴 수 있는 상황 하나만 대봐." |
| L5 | **Transfer / Synthesis** | 적용, 비교, 종합 | "이걸 네 프로젝트에 적용하면 뭘 바꾸겠어?" |

- **Level은 AI가 mode + intent 기반으로 자동 선택** (사용자 선택 아님)
- Error Loop는 별도 축 — L1~L5 어디서든 발생

---

## 8. 평가 시스템 (Error Loop)

### 판정 4분류
| 배지 | 판정 | 후속 |
|------|------|------|
| ✅ | **정확** | 저장하고 넘어가기 |
| 🟡 | **부분적** | 빈틈 설명 + 후속 질문 → 재시도 |
| ❌ | **틀림** | 잘못된 방향 설명 + 후속 질문 → 재시도 |
| 📦 | **암기형** | 말은 맞지만 이해 얕음 → 더 깊은 질문 |

### 평가 시 반드시 남기는 것
- 맞은 부분
- 빠진 부분 (1~2개로 좁힘)
- 후속 질문 1개 (같은 빈틈을 다시 찌름)

### 금지
- 시작부터 정답 제공
- 빈 칭찬 ("좋아요!")
- 학습 정보 없는 피드백

### 재시도 흐름
- 1차 답변 → 평가 → 후속 질문 → 2차 답변 → 최종 평가
- 2차까지 실패 또는 [정답 보기] → 모범 답안 제공
- **Phase 1: 최대 1회 재시도**

---

## 9. 확신도 (Confidence)

답변 제출 전 3단계 칩:

| 확신도 | 의미 |
|--------|------|
| **낮음** | "잘 모르겠는데..." |
| **중간** | "아마 맞을 거야" |
| **높음** | "확실해" |

- **높음 + 틀림** = 가장 위험한 착각 → 약점 우선 기록
- **낮음 + 맞음** = 이해는 있지만 확신 부족 → 복습 후보
- 확신도는 리뷰 큐 우선순위 결정에 사용

---

## 10. 기술 스택

| 구분 | 선택 | 근거 |
|------|------|------|
| **빌드** | Vite 6.x | 즉시 HMR |
| **프레임워크** | React 19 + TypeScript | TS 스택 |
| **PDF** | `@react-pdf-viewer/core` + `highlight` | pdf.js 래퍼 |
| **UI** | shadcn/ui + Tailwind CSS 4 | Newsprint 커스텀 |
| **AI** | `@anthropic-ai/sdk` + **AiProvider 추상화** | 멀티 프로바이더 대비 |
| **저장** | localStorage (Phase 1) → IndexedDB (Phase 2) | 서버 제로 |
| **검증** | zod | AI JSON 응답 파싱 |
| **Export** | Blob + download | 마크다운 생성 |

### CORS 전략
- **Day 1 첫 작업**: `dangerouslyAllowBrowser: true`로 Anthropic API 직접 호출 테스트
- 성공 → 브라우저 직접 호출 (데모/내부용)
- 실패 → Vite proxy (`/api/anthropic`) 즉시 전환 (코드 5분)
- 배포 시 → CF Worker proxy

### 모델
- 기본: `claude-sonnet-4-6`
- 경량: `claude-haiku-4-5`
- Settings UI는 alias 표시 ("Sonnet 4.6" / "Haiku 4.5")

### API Key 보안
- **기본: sessionStorage** (탭 닫으면 삭제)
- `rememberKey` 토글 켜면 localStorage 저장 (사용자 명시 선택)
- Phase 2+: Web Crypto 암호화 고려

### 디자인 시스템: Newsprint
> 전체 프롬프트: `design-system prompt.md` 참조

- 서체: Playfair Display (헤드라인) / Lora (본문) / Inter (UI) / JetBrains Mono (데이터)
- 색상: `#F9F9F7` 배경, `#111111` 텍스트/보더, `#CC0000` 극소량 강조
- Border Radius: `0px` 전체
- 호버: Hard offset shadow (`4px 4px 0px 0px #111`)
- 톤: "신문지 위의 메모" — 깔끔하되 따뜻한 아날로그

### 의도적 제외 (Phase 1)
- ❌ 서버/백엔드, DB, 라우팅, 인증
- ❌ [다른 도발] 버튼 → Phase 2
- ❌ 챕터 감지 → Phase 2 TOC
- ❌ 다중 하이라이트 색상 → Phase 3
- ❌ 라이브러리 / 통계 → Phase 3+

---

## 11. 프로젝트 구조

```
reading-provocateur/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── package.json
├── public/
│   └── sample.pdf
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # 온보딩 ↔ 메인 리딩 전환
│   │
│   ├── components/
│   │   ├── PdfViewer.tsx          # @react-pdf-viewer + highlight + 텍스트 추출
│   │   ├── FileDropZone.tsx       # PDF 드래그앤드롭 + 온보딩 + 세션 모드 선택
│   │   ├── NavBar.tsx             # 상단 바 (책 제목, 페이지, Settings, Export)
│   │   ├── BottomBar.tsx          # 하단 p.N/M + 진행률 바
│   │   ├── FloatingToolbar.tsx    # [🟡 Highlight] [💭 Provoke] + Intent chips
│   │   ├── SidePanel.tsx          # 사이드 패널 컨테이너
│   │   ├── EmptyState.tsx         # State A: 안내
│   │   ├── LoadingCard.tsx        # State Loading: AI 응답 대기
│   │   ├── ProvocationCard.tsx    # State B: 질문 + 답변 + 확신도
│   │   ├── EvaluationCard.tsx     # State C: 평가 + 후속 질문 + 재시도
│   │   ├── SettingsDialog.tsx     # API Key + 모델 + 세션 기본값
│   │   └── ExportPreview.tsx      # Export + 약점 목록 + 리뷰 질문
│   │
│   ├── lib/
│   │   ├── ai-provider.ts         # AiProvider 인터페이스 + Anthropic 구현
│   │   ├── generate-provocation.ts # 도발 생성 (mode + intent 기반)
│   │   ├── evaluate-answer.ts     # 답변 평가 (verdict + followUp)
│   │   ├── build-review-items.ts  # 약점 기록 생성
│   │   ├── extract-context.ts     # 선택 텍스트 ±800자 발췌
│   │   ├── prompts.ts             # 프롬프트 템플릿
│   │   ├── store.ts               # localStorage CRUD
│   │   ├── export.ts              # 마크다운 생성 (약점 + 리뷰 질문 포함)
│   │   └── schemas.ts             # zod 스키마 (AI JSON 응답 검증)
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── styles/
│       └── globals.css
│
└── .env.example
```

---

## 12. 데이터 모델

```typescript
// === Enums ===
type SessionMode = "understand" | "apply" | "exam" | "critique";
type HighlightIntent = "core" | "confused" | "connection" | "apply";
type ProvocationKind = "recall" | "compression" | "misconception" | "challenge" | "transfer";
type EvaluationVerdict = "correct" | "partial" | "incorrect" | "memorized";
type ConfidenceLevel = "low" | "medium" | "high";

// === Entities ===
interface Book {
  id: string;
  fileName: string;
  totalPages: number;
  currentPage: number;
  addedAt: string;
}

interface SessionContext {
  bookId: string;
  mode: SessionMode;
  startedAt: string;
  firstPage: number;
  lastPage: number;
}

interface Annotation {
  id: string;
  bookId: string;
  pageNumber: number;
  selectedText: string;
  highlightAreas: HighlightArea[];
  intent: HighlightIntent | null;   // 단순 하이라이트면 null
  createdAt: string;
}

interface Provocation {
  id: string;
  bookId: string;
  annotationId: string | null;      // "도발해줘" 버튼 = null
  pageNumber: number;
  selectedText: string | null;
  contextExcerpt: string;           // 선택 ±800자 발췌
  sessionMode: SessionMode;
  intent: HighlightIntent | null;
  kind: ProvocationKind;            // AI 자동 선택
  question: string;
  answer: string | null;
  confidence: ConfidenceLevel | null;
  createdAt: string;
  answeredAt: string | null;
  evaluation: Evaluation | null;
}

interface Evaluation {
  verdict: EvaluationVerdict;
  whatWasRight: string[];
  missingPoints: string[];
  followUpQuestion: string | null;
  retryAnswer: string | null;
  retryVerdict: EvaluationVerdict | null;
  retryEvaluatedAt: string | null;
}

interface ReviewItem {
  id: string;
  bookId: string;
  conceptLabel: string;
  sourceProvocationId: string;
  status: "weak" | "pending-review" | "resolved";
  reviewPrompt: string;             // 다음 세션용 질문
  createdAt: string;
}

interface Settings {
  provider: "anthropic";
  apiKey: string;
  rememberKey: boolean;             // 기본 false → sessionStorage
  model: "claude-sonnet-4-6" | "claude-haiku-4-5";
  defaultMode: SessionMode;
  obsidianFrontmatter: boolean;
}

// localStorage keys
// "rp:settings", "rp:books", "rp:session:{bookId}",
// "rp:annotations:{bookId}", "rp:provocations:{bookId}",
// "rp:reviews:{bookId}"
```

---

## 13. AI 기능 분리

### 13.1 Provider 추상화

```typescript
interface AiProvider {
  generateProvocation(input: GenerateProvocationInput): Promise<ProvocationPayload>;
  evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluationPayload>;
}

// Anthropic 구현
class AnthropicProvider implements AiProvider { ... }
```

### 13.2 도발 생성

```typescript
interface GenerateProvocationInput {
  bookTitle: string;
  sessionMode: SessionMode;
  intent: HighlightIntent | null;
  selectedText: string | null;
  contextExcerpt: string;
  recentProvocations: Provocation[];  // 최근 3개, 중복 방지
  recentWeakConcepts: string[];       // 약점 연결
}

// AI 응답 (JSON)
interface ProvocationPayload {
  kind: ProvocationKind;
  question: string;
}
```

### 13.3 답변 평가

```typescript
interface EvaluateAnswerInput {
  sessionMode: SessionMode;
  question: string;
  answer: string;
  confidence: ConfidenceLevel;
  selectedText: string | null;
  contextExcerpt: string;
}

// AI 응답 (JSON)
interface EvaluationPayload {
  verdict: EvaluationVerdict;
  whatWasRight: string[];
  missingPoints: string[];
  followUpQuestion: string | null;
}
```

### 13.4 리뷰 아이템 생성

```typescript
// verdict가 partial/incorrect/memorized → 생성
// correct이지만 confidence "low" → 후보 생성
function buildReviewItems(provocation: Provocation, evaluation: Evaluation): ReviewItem[];
```

### JSON 파싱 전략
- `zod` 스키마로 검증
- 파싱 실패 시 same prompt + "JSON만 반환하세요" 1회 재시도

---

## 14. 프롬프트 설계 원칙

### 도발 생성
- 답을 주지 말 것
- 질문 1개만
- `sessionMode` + `intent`에 맞출 것
- 최근 질문과 중복 금지
- `selectedText`가 있으면 반드시 anchor
- 톤: **코치형** — 직설적이되 격려적, 반말

### 평가
- 칭찬으로 시작하지 말 것
- 먼저 verdict
- 정답 바로 주지 말 것
- 빈 요소 1~2개로 좁힐 것
- follow-up은 같은 빈틈을 다시 찌를 것
- 2차 실패 또는 [정답 보기] → 모범 답안

---

## 15. 컨텍스트 추출

```typescript
interface ExtractedContext {
  selectedText: string | null;
  excerpt: string;       // 선택 텍스트 ±800자
  pageNumber: number;
}
```

- 선택 텍스트 기준으로 page text에서 index 탐색 → 앞뒤 400~800자
- 못 찾으면 full page 첫 1500자 fallback
- 저장은 excerpt만 (토큰 비용 절감 + 질문 구체성 향상)

---

## 16. UI 레이아웃

### 온보딩 (PDF 미선택 시)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                     📖 Reading Provocateur                           │
│                                                                      │
│          "읽은 거 덮고, 핵심 3개만 적어봐."                            │
│                                                                      │
│              ┌──────────────────────────────┐                        │
│              │  📂 PDF 파일을 열거나         │                        │
│              │     여기에 드래그하세요       │                        │
│              └──────────────────────────────┘                        │
│                                                                      │
│              또는 [샘플로 체험하기]                                    │
│                                                                      │
│   ─────────────────────────────────────────────────────────          │
│                                                                      │
│   오늘의 읽기 모드:                                                   │
│   [이해]  [적용]  [시험]  [비판]                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 메인 리딩 뷰 (70:30 Split)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [📂]  ｢책 제목｣    이해 모드         p.47/312    [⚙] [📥 Export]    │
├──────────────────────────────────────────────┬───────────────────────┤
│                                              │   PROVOCATEUR        │
│   PDF Viewer (70%)                           │                      │
│                                              │   [State에 따라      │
│                                              │    A/Loading/B/C]    │
│   텍스트 선택 시 →                            │                      │
│   FloatingToolbar 표시                        │                      │
│                                              │                      │
│                                              │                      │
│                                              │   ── 이전 도발 ──    │
│                                              │   (스크롤 목록)      │
│                                              │                      │
│   ◀ prev                        next ▶       │   [도발해줘 💭]       │
├──────────────────────────────────────────────┴───────────────────────┤
│  p.47 / 312  ████████████████░░░░░░░░░░░░░  15%                     │
└──────────────────────────────────────────────────────────────────────┘
```

### 플로팅 툴바 + Intent Chips

```
텍스트 선택 시:
┌────────────────────────────────┐
│  [🟡 Highlight]  [💭 Provoke]  │
└────────────────────────────────┘

Provoke 클릭 시:
┌────────────────────────────────┐
│  왜 여기서 묻길 원해?          │
│  [핵심] [헷갈림] [연결] [적용]  │
└────────────────────────────────┘
```

### Side Panel States

**State A — 빈 상태:**
```
┌───────────────────────┐
│   PROVOCATEUR          │
│   ─────────────────── │
│       💭               │
│   텍스트를 하이라이트   │
│   하고 [Provoke]를     │
│   눌러보세요           │
│                        │
│  ╔════════════════════╗│
│  ║   도발해줘 💭      ║│
│  ╚════════════════════╝│
└───────────────────────┘
```

**State Loading — AI 응답 대기:**
```
┌───────────────────────┐
│   PROVOCATEUR          │
│  ┌────────────────────┐│
│  │   💭 생각 중···     ││
│  │   · · ·            ││
│  └────────────────────┘│
└───────────────────────┘
```

**State B — 질문 카드 + 답변 + 확신도:**
```
┌───────────────────────┐
│   PROVOCATEUR          │
│  ┌────────────────────┐│
│  │ L3 · Misconception ││
│  │ 이해 모드           ││
│  │                    ││
│  │ "많이들 여기서 뭐랑 ││
│  │  헷갈릴 것 같아?    ││
│  │  네 생각은?"        ││
│  │                    ││
│  │ p.47 · 헷갈림       ││
│  │────────────────────││
│  │ ┌──────────────┐   ││
│  │ │ 답변 입력...  │   ││
│  │ └──────────────┘   ││
│  │                    ││
│  │ 확신도:             ││
│  │ [낮음] [중간] [높음] ││
│  │                    ││
│  │         [제출]      ││
│  └────────────────────┘│
│                        │
│  ╔════════════════════╗│
│  ║   도발해줘 💭      ║│
│  ╚════════════════════╝│
└───────────────────────┘
```

**State C — 평가 + 재시도:**
```
┌───────────────────────┐
│   PROVOCATEUR          │
│  ┌────────────────────┐│
│  │ 🟡 부분적           ││
│  │                    ││
│  │ ✓ 맞은 점:          ││
│  │   방향은 맞다       ││
│  │                    ││
│  │ ✗ 빠진 점:          ││
│  │   저자의 전제가     ││
│  │   빠졌어            ││
│  │                    ││
│  │ 후속 질문:          ││
│  │ "좋아, 그럼 저자가  ││
│  │  깔고 있는 전제를   ││
│  │  한 줄로 다시       ││
│  │  말해봐."           ││
│  │                    ││
│  │ ┌──────────────┐   ││
│  │ │ 재답변...     │   ││
│  │ └──────────────┘   ││
│  │                    ││
│  │ ╔══════════════╗   ││
│  │ ║  다시 답변    ║   ││
│  │ ╚══════════════╝   ││
│  │ [저장하고 넘어가기] ││
│  │ [정답 보기]         ││
│  └────────────────────┘│
└───────────────────────┘
```

### Export (약점 + 리뷰 질문 포함)

```
┌──────────────────────────────────────────────┐
│  📄 Export Preview                   [X 닫기] │
│  ┌──────────────────────────────────────────┐│
│  │  # ｢책 제목｣ — 독서 노트                 ││
│  │  모드: 이해 | Date: 2026-03-08           ││
│  │                                          ││
│  │  ## p.47 — Misconception · 헷갈림         ││
│  │  > "하이라이트된 텍스트"                   ││
│  │  💭 질문: "..."                           ││
│  │  ✍️ 답변: "..." (확신: 높음)              ││
│  │  🟡 부분적 — 빠진 점: 저자 전제           ││
│  │  → 재시도: "..." → ✅ 정확                ││
│  │                                          ││
│  │  ---                                     ││
│  │                                          ││
│  │  ## 약점 목록                              ││
│  │  - 프로페셔널리즘 vs 장인정신 차이         ││
│  │  - 저자의 핵심 가정 설명 부족              ││
│  │                                          ││
│  │  ## 다음 세션 리뷰 질문                    ││
│  │  1. 어제 헷갈린 개념 하나만 다시 설명해봐  ││
│  │  2. 이 장의 핵심 가정은 뭐였지?           ││
│  │  3. 반례 하나만 말해봐                    ││
│  │                                          ││
│  │  ## 📊 세션 통계                          ││
│  │  - 도발 5개 · 정확 2 · 부분 2 · 틀림 1    ││
│  │  - 읽은 범위: p.38~47 · ~25분             ││
│  └──────────────────────────────────────────┘│
│  Obsidian 프론트매터: [ON/OFF]                │
│  ╔════════════════════╗                      │
│  ║   다운로드 (.md)    ║                      │
│  ╚════════════════════╝                      │
└──────────────────────────────────────────────┘
```

### Settings

```
┌──────────────────────────────────────┐
│  ⚙ Settings                  [Done]  │
│  ──────────────────────────────────  │
│  AI 연동                             │
│  ┌──────────────────────────────┐    │
│  │ Claude API Key               │    │
│  │ sk-ant-api03...••••••••••    │    │
│  │ 이 기기에 기억 [OFF]          │    │
│  └──────────────────────────────┘    │
│  모델                                │
│  ┌──────────────────────────────┐    │
│  │ ● Sonnet 4.6 (추천)          │    │
│  │ ○ Haiku 4.5 (빠름)           │    │
│  └──────────────────────────────┘    │
│  세션 기본값                          │
│  ┌──────────────────────────────┐    │
│  │ 기본 모드: [이해 ▼]           │    │
│  │ Obsidian 프론트매터: [ON]     │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

---

## 17. 구현 일정

### Day 1 (5~6시간)

| 시간 | 작업 | DoD |
|------|------|-----|
| 0.5h | 프로젝트 셋업 + CORS 확인 + Newsprint 테마 | `npm run dev` + API 호출 성공 |
| 1h | PdfViewer + highlight + FloatingToolbar + **Intent chips** | 선택 → intent 선택 동작 |
| 0.5h | 온보딩 화면 + **세션 모드 4종 선택** + 샘플 PDF | 모드 선택 → PDF 로드 |
| 0.5h | NavBar + BottomBar + Split 70:30 | 기본 레이아웃 |
| 1h | `generateProvocation` + **AiProvider** + ProvocationCard | mode+intent 기반 질문 생성 |
| 1h | 답변 입력 + **확신도 chips** + localStorage 저장 | 답변 + 확신도 저장 |
| 0.5h | Settings (API Key + 모델 + 기본 모드) | 설정 저장/로드 |

### Day 2 (5~6시간)

| 시간 | 작업 | DoD |
|------|------|-----|
| 1.5h | `evaluateAnswer` + **EvaluationCard** + 후속 질문 + 재시도 | Error Loop 1회 동작 |
| 0.5h | `buildReviewItems` + ReviewItem 저장 | 약점 기록 생성 |
| 1h | ExportPreview + 마크다운 (약점 + 리뷰 질문 + 세션 통계) | Export 완료 |
| 0.5h | 이전 도발 목록 (SidePanel 스크롤) | 이전 카드 표시 |
| 0.5h | zod 스키마 + JSON 파싱 재시도 | AI 응답 안정화 |
| 0.5h | UI 폴리싱 (LoadingCard, 반응형 최소) | 데모 품질 |
| 0.5h | **킬 테스트 리허설** | 무중단 재현 |

---

## 18. 킬 테스트

```
앱 열기
→ 세션 모드 = 이해
→ [샘플로 체험하기]
→ 텍스트 선택
→ [Provoke] → intent = 헷갈림
→ AI 질문 생성 (L3 Misconception)
→ 답변 입력
→ 확신도 = 높음
→ AI 평가 = 🟡 부분적
→ "맞은 점 / 빠진 점 / 후속 질문" 표시
→ 재답변
→ ✅ 정확
→ Export에서 약점 목록 + 리뷰 질문 확인
```

**1분 30초 무중단 재현.** 이게 되면 "AI 학습 앱"이다.

---

## 19. 완료 기준 (DoD)

| # | 기능 | DoD |
|---|------|-----|
| 1 | PDF 열기 | 파일 선택/드래그/샘플 → 렌더링 + 페이지 이동 |
| 2 | 세션 모드 | 4종 선택 → 질문 생성에 반영 |
| 3 | 하이라이트 + Intent | 선택 → [Provoke] → intent 4종 칩 → 질문 종류 변화 |
| 4 | 컨텍스트 추출 | 선택 ±800자 발췌 → AI 전달 |
| 5 | 도발 생성 | mode + intent 기반 질문 + JSON 파싱 + 중복 방지 |
| 6 | 답변 + 확신도 | 텍스트 입력 + 3단계 확신도 |
| 7 | **평가 + 재시도** | verdict 4분류 + 빈틈 + 후속 질문 + 재답변 1회 |
| 8 | 약점 기록 | partial/incorrect/memorized → ReviewItem 생성 |
| 9 | Export | 마크다운 + **약점 목록 + 리뷰 질문** + 세션 통계 |
| 10 | Settings | API Key (session 기본) + 모델 + 기본 모드 |

---

## 20. Phase 로드맵

### Phase 1 — Learning-first Kill Demo ✅ (이 문서)
- 세션 모드 4종 + Intent 4종
- 도발 생성 (AI 자동 kind 선택)
- 답변 + 확신도 + **Minimal Error Loop (1회 재시도)**
- 약점 기록 + Export (약점 + 리뷰 질문)
- AiProvider 추상화 + JSON 파싱

### Phase 1.5 — Meta-cognition 강화
- 챕터 종료 검증 (3~5문항)
- Interruption Budget (자동 도발 제한)
- 답변 scaffolding ("한 줄로" / "예시 하나만")
- 확신도 기반 리뷰 큐 우선순위

### Phase 2 — Memory Engine
- **다음 세션 시작 리뷰 카드** (지연 회상)
- 책 메모리 그래프 (챕터별 구조화 JSON)
- 히스토리 탭 + 도발 트레일
- 개념별 약점 뷰
- [다른 도발] [스킵]
- IndexedDB 전환

### Phase 3 — Reader 완성
- TOC / 검색 / 노트 / 다크모드
- 반응형 (모바일)
- 4색 하이라이트 (의미 있는 색상 체계)
- 사이드뷰 resize
- 개발 서적 플러그인

### Phase 4 — 확장
- 라이브러리 + 통계
- 도발 톤 설정 (3축 슬라이더)
- 도발 언어 설정
- Todait 연동 (진도 + 이해도)
- cross-book review

---

## 21. 리스크 & 대응

| 리스크 | 확률 | 대응 |
|--------|------|------|
| **CORS 차단** | 중~높 | Day 1 직접 확인 → Vite proxy / CF Worker |
| **API Key 노출** | 높 | sessionStorage 기본, rememberKey 명시 선택 |
| **모델 ID 노후화** | 높 | alias 기반 설정 |
| **AI 평가 부정확** | 중 | JSON schema + 프롬프트 엄격화 + retry |
| **자동 개입 과다** | 중 | 수동 우선, Phase 1.5 Interruption Budget |
| **텍스트 추출 품질** | 중 | selection-based excerpt 우선 |
| **localStorage 한계** | 중 | Phase 2 IndexedDB 전환 |
| **학습보다 UI 앞섬** | 높 | **Error Loop를 Phase 1에 포함** |

---

## 22. 성공 지표

| 지표 | 측정 방법 |
|------|----------|
| 도발 응답률 | 답변 있는 도발 / 전체 도발 |
| 1차→2차 전환율 | partial/incorrect 후 재시도 → correct 비율 |
| 약점 해소율 | weak → resolved 전환율 (Phase 2) |
| 다음 세션 회상 성공률 | 리뷰 카드 정답률 (Phase 2) |
| Export 사용률 | Export 클릭 / 세션 종료 |
| 완독률 | 마지막 페이지 도달 / 책 시작 |

---

## 23. 잔여물(노트) 시스템

### Layer 1 — 원시 로그 (자동)
질문/답변/판정/후속 질문/재시도 전체 기록

### Layer 2 — 사용자 언어 노트 (자동 편집)
오직 사용자 답변 원문만으로 엮은 노트 (AI 텍스트 미혼합)

### Layer 3 — AI 진단 노트 (별도)
- 약한 개념
- 혼동 포인트
- 다음 세션 리뷰 질문
- 확신도 기반 우선순위

> 킬링 포인트: 사용자는 답했을 뿐인데
> 끝나고 보면 **"내 말로 쓴 노트"와 "AI가 만든 리뷰 큐"가 둘 다 남아있다.**

---

## 관련 문서

| 문서 | 역할 | 위치 |
|------|------|------|
| `design-system prompt.md` | Newsprint 디자인 시스템 전문 | 현행 |
| `legacy/concept.md` | 초기 컨셉 (v1) | 아카이브 |
| `legacy/implementation-plan-web.md` | 웹 구현 계획 v3 | 아카이브 |
| `legacy/Reading Provocateur - v1 UI Layout...` | ASCII 레이아웃 12개 | 아카이브 |
| `legacy/rp-concept-v2-learning-first.md` | 학습 중심 컨셉 (ChatGPT) | 참조 |
| `legacy/rp-implementation-plan-v4-learning-first.md` | 학습 중심 구현 v4 (ChatGPT) | 참조 |
| `legacy/rp-feedback-summary-2026-03-08.md` | 피드백 요약 (ChatGPT) | 참조 |
| `ios/` | iPadOS SwiftUI 아카이브 | 아카이브 |

---

*MUSE 💡 — 2026-03-08 | Learning-first PRD v1*
