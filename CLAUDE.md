# CLAUDE.md — Reading Provocateur

## 프로젝트 개요
AI가 읽기 중 도발적 질문을 던져 학습을 강제하는 재시도 엔진. 웹 SPA.

## 기술 스택
- Vite 6 + React 19 + TypeScript 5.7
- `@react-pdf-viewer/core` + `highlight` (4.x) — React 19 비호환 시 `react-pdf` 대안
- `@tailwindcss/vite` (v4, Vite 플러그인 방식 — postcss/autoprefixer 불필요)
- shadcn/ui + Tailwind CSS 4
- `@anthropic-ai/sdk` (dangerouslyAllowBrowser)
- zod (AI JSON 응답 검증)
- Vitest + @testing-library/react + jsdom
- localStorage / sessionStorage
- lucide-react (아이콘)

## 디자인 시스템: Newsprint
- 폰트: Playfair Display (헤드라인) / Lora (본문) / Inter (UI) / JetBrains Mono (데이터)
- 색상: `#F9F9F7` 배경, `#111111` 텍스트/보더, `#CC0000` 극소 강조
- border-radius: 0px 전체
- hover: hard offset shadow (`4px 4px 0px 0px #111`)
- 하이라이트: `rgba(254, 243, 199, 0.6)` (warm yellow)
- 버튼: uppercase tracking-widest, 반전 hover
- 입력: border-b-2 border-[#111] bg-transparent font-mono

## 개발 방법론
- **TDD (Red→Green→Refactor)**: 항상 실패하는 테스트 먼저 작성
- Feature 단위 커밋 (feat: ..., fix: ..., chore: ...)
- 각 Feature 완료 시 `npm test` 통과 확인 후 git commit
- `tsc --noEmit` 에러 0 유지

## 테스트 설정
```bash
npm test          # Vitest 실행
npx tsc --noEmit  # 타입 체크
npm run build     # Vite 빌드
```

Vitest 설정:
```ts
// vitest.config.ts — environment: jsdom, include: ["__tests__/**/*.test.{ts,tsx}"]
// vitest.setup.ts — import "@testing-library/jest-dom"
```

테스트 위치: `__tests__/lib/`, `__tests__/hooks/`, `__tests__/components/`

## 상세 구현 계획서
전체 구현 계획은 `docs/implementation-plan.md` 참조.

---

## Feature 구현 순서 (순차, TDD)

### Feature 1: 데이터 모델 + 스토어 + 스키마
파일: `src/types/index.ts`, `src/lib/schemas.ts`, `src/lib/store.ts`
테스트: `__tests__/lib/schemas.test.ts` (7), `__tests__/lib/store.test.ts` (10)

타입 정의 (14 interface/type):
- SessionMode: "understand" | "apply" | "exam" | "critique"
- HighlightIntent: "core" | "confused" | "connection" | "apply"
- ProvocationKind: "recall" | "compression" | "misconception" | "challenge" | "transfer"
- EvaluationVerdict: "correct" | "partial" | "incorrect" | "memorized"
- ConfidenceLevel: "low" | "medium" | "high"
- SidePanelState: "empty" | "loading" | "question" | "evaluating" | "evaluation" | "modelAnswer" | "saved"
- Book: { id, fileName, totalPages, currentPage, addedAt }
- SessionContext: { bookId, mode, startedAt, endedAt, firstPage, lastPage }
- Annotation: { id, bookId, pageNumber, selectedText, highlightAreas, intent, createdAt }
- Provocation: { id, bookId, annotationId, pageNumber, selectedText, contextExcerpt, sessionMode, intent, kind, question, answer, confidence, createdAt, answeredAt, evaluation, modelAnswer }
- Evaluation: { verdict, whatWasRight, missingPoints, followUpQuestion, retryAnswer, retryVerdict, retryEvaluatedAt }
- ReviewItem: { id, bookId, conceptLabel, sourceProvocationId, status, reviewPrompt, createdAt }
- Settings: { provider, apiKey, rememberKey, model, defaultMode, obsidianFrontmatter }

zod 스키마: ProvocationPayload, EvaluationPayload

store:
- saveBook/getBooks, saveAnnotation/getAnnotations(bookId), saveProvocation/getProvocations(bookId)/updateProvocation
- saveReviewItem/getReviewItems(bookId), saveSettings/getSettings (rememberKey → session vs local), saveSession/getSession/updateSession

DoD: 타입 14개, zod 7/7, store 10/10

### Feature 2: 컨텍스트 추출 + 프롬프트
파일: `src/lib/extract-context.ts`, `src/lib/prompts.ts`
테스트: `__tests__/lib/extract-context.test.ts` (6)

extract-context: 선택 텍스트 기준 ±800자 추출. null이면 첫 1500자 fallback.
prompts: 도발 생성 / 답변 평가 / 모범 답안 — 3종 프롬프트 (system + user 구조).
- 도발: mode + intent + selectedText + context + recentProvocations(중복방지) + weakConcepts
- 평가: answer + confidence + question + context. verdict 4분류. 칭찬 금지, 빈틈 1~2개 좁힘.
- 모범답안: 간결 3~5문장, 빠진 부분 보충, 코치형 반말.
- intent=null(페이지 기반): "선택 텍스트: (없음)" → AI가 맥락에서 핵심 자동 선택.

DoD: extract 6/6, 프롬프트 3종 구현

### Feature 3: AI Provider + 도발 생성 + 평가 + 모범답안
파일: `src/lib/ai-provider.ts`, `src/lib/generate-provocation.ts`, `src/lib/evaluate-answer.ts`, `src/lib/generate-model-answer.ts`
테스트: `__tests__/lib/generate-provocation.test.ts` (10), `__tests__/lib/evaluate-answer.test.ts` (7), `__tests__/lib/generate-model-answer.test.ts` (4)

AiProvider interface: { generateProvocation, evaluateAnswer, generateModelAnswer }
AnthropicProvider: Anthropic SDK, dangerouslyAllowBrowser: true
JSON 파싱: zod + 실패 시 "반드시 JSON만" 1회 재시도. 2회 실패 → throw.

DoD: 21/21 테스트

### Feature 4: 약점 기록 + Export
파일: `src/lib/build-review-items.ts`, `src/lib/export.ts`
테스트: `__tests__/lib/build-review-items.test.ts` (8), `__tests__/lib/export.test.ts` (13)

ReviewItem 생성 규칙:
- correct → 미생성 (단, confidence=low → pending-review)
- partial/incorrect/memorized → weak
- conceptLabel = missingPoints[0]

Export 마크다운 구조:
- 제목 + 모드 + 날짜
- 도발 카드들 (page, kind, intent, Q, A, confidence, verdict, retry, modelAnswer)
- **Layer 2: 사용자 답변만 추출 (AI 텍스트 미혼합)**
- 약점 목록
- 리뷰 질문 (최대 5개)
- 세션 통계: 도발 수, 판정 분포, 확신도 분포, ⚡높은확신+틀림, 읽은 범위(firstPage~lastPage), 소요 시간
- Obsidian 프론트매터 ON/OFF

DoD: 21/21 테스트

### Feature 5: 핵심 상태 머신 Hook
파일: `src/hooks/useProvocationFlow.ts`, `src/hooks/useSession.ts`, `src/hooks/useSettings.ts`
테스트: `__tests__/hooks/useProvocationFlow.test.ts` (20), `__tests__/hooks/useSession.test.ts` (7), `__tests__/hooks/useSettings.test.ts` (5)

useProvocationFlow 상태 전환:
empty → loading → question → evaluating → evaluation(partial/incorrect/memorized) → retry → evaluating → saved
                                        → saved (correct)
                          evaluation → modelAnswer (2차 실패 or 정답 보기) → saved
에러 시 state 복원 + 에러 메시지 설정.

useSession: mode, book, startedAt, endedAt, firstPage, lastPage, getDuration()
useSettings: load/save, rememberKey 분기

DoD: 32/32 테스트

### Feature 6: 프로젝트 셋업 + Newsprint 테마 + CORS/PDF PoC
1. `npm create vite@latest . -- --template react-ts` (이미 init된 디렉토리에)
2. `npm install` 전체 의존성
3. `@tailwindcss/vite` 설정 (vite.config.ts)
4. globals.css: Newsprint 폰트 import, 색상, 텍스처, utility class
5. CORS 확인: dangerouslyAllowBrowser → Anthropic API 호출 테스트
6. @react-pdf-viewer React 19 호환성 확인 → 비호환 시 react-pdf로 전환
7. Vitest 설정

DoD: npm run dev + npm test + 폰트 4종 + API 호출 성공 + PDF 렌더링

### Feature 7: 온보딩 + 세션 모드
파일: `src/components/SessionModeSelector.tsx`, `src/components/FileDropZone.tsx`, `src/App.tsx`
테스트: `__tests__/components/SessionModeSelector.test.tsx` (6)

4모드 카드 (이해/적용/시험/비판) + Newsprint 반전 스타일
[샘플로 체험하기] → sample.pdf 로드
API Key 없으면 Settings Dialog 자동 오픈

DoD: 6/6 테스트, 온보딩→메인 전환

### Feature 8: 메인 레이아웃 + PDF 뷰어
파일: `src/components/NavBar.tsx`, `src/components/BottomBar.tsx`, `src/components/PdfViewer.tsx`

70:30 Split, NavBar(책 제목 + 모드 배지 + 페이지 + Settings/Export), BottomBar(p.N/M + 진행률)
highlight plugin + 저장된 하이라이트 복원 (renderHighlights)

DoD: 레이아웃 + PDF 페이지 이동 + 하이라이트 복원

### Feature 9: FloatingToolbar + Intent
파일: `src/components/FloatingToolbar.tsx`
테스트: `__tests__/components/FloatingToolbar.test.tsx` (7)

2-step: Step 1 [🟡 Highlight][💭 Provoke] → Step 2 "왜 여기서 묻길 원해?" + 4칩(핵심/헷갈림/연결/적용)
Newsprint: bg-[#111] text-[#F9F9F7] uppercase tracking-wider

DoD: 7/7

### Feature 10: SidePanel + ProvocationCard
파일: `src/components/SidePanel.tsx`, `src/components/ProvocationCard.tsx`, `src/components/EmptyState.tsx`, `src/components/LoadingCard.tsx`
테스트: `__tests__/components/SidePanel.test.tsx` (11), `__tests__/components/ProvocationCard.test.tsx` (9)

8 state 전환. "도발해줘 💭" → SidePanel 내 Intent chips. 하단 고정(empty, question, saved).
답변 + 확신도 둘 다 있어야 [제출] 활성화.

DoD: 20/20

### Feature 11: EvaluationCard + ModelAnswer + Error Loop
파일: `src/components/EvaluationCard.tsx`, `src/components/ModelAnswerCard.tsx`
테스트: `__tests__/components/EvaluationCard.test.tsx` (13), `__tests__/components/ModelAnswerCard.test.tsx` (3)

verdict 4배지 (emerald/amber/red/neutral). correct → [저장], 나머지 → [다시 답변] primary.
2차 실패 or [정답 보기] → 모범 답안 생성 + 표시.

DoD: 16/16

### Feature 12: History + Settings + Export
파일: `src/components/HistoryList.tsx`, `src/components/SettingsDialog.tsx`, `src/components/ExportPreview.tsx`
테스트: `__tests__/components/HistoryList.test.tsx` (5), `__tests__/components/SettingsDialog.test.tsx` (7), `__tests__/components/ExportPreview.test.tsx` (9)

히스토리 미니 카드 + 클릭→페이지 점프. Settings Newsprint input. Export Layer 1+2+3+통계.

DoD: 21/21

### Feature 13: 에러 핸들링 + UI 폴리싱
에러 UX: API Key 무효 → Settings 오픈, Rate limit → N초 후 재시도, 네트워크 → 재시도 버튼, 토큰 초과 → 컨텍스트 축소.
LoadingCard 3-dot pulse. 반응형 1024+ 70:30, 768~1024 60:40.

DoD: 에러 4종, pulse, 반응형

---

## 전체 DoD
- 167/167 테스트 통과
- tsc --noEmit 에러 0
- 킬 테스트 1분 30초 무중단 재현

## 킬 테스트 시나리오
앱 열기 → 이해 모드 → API Key 입력 → 샘플 PDF → 텍스트 선택 → Provoke → 헷갈림 → 질문 → 답변+확신도 높음 → 제출 → 🟡 부분적 → 재답변 → ✅ 정확 → 저장 → Export → 다운로드

## 완료 시 알림
전체 구현 완료 후 반드시 실행:
```bash
openclaw system event --text "Done: Reading Provocateur Phase 1 — 167 tests, all features implemented" --mode now
```
