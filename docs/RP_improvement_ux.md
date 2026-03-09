---
tags:
  - 주제/RP
  - 타입/이슈
  - 상태/현행
created: 2026-03-09
author: MUSE
references:
  - "[[PRD]]"
  - "[[Gap Verification Review (2026-03-09)]]"
---

# Reading Provocateur — 개선 이슈 정리

> 실제 사용 테스트 + 토니 피드백 기반
> 2026-03-09

---

## 이슈 1: 세션 모드 전환 불가

### 현재 상태

```
온보딩 → 모드 선택 (이해/적용/시험/비판) → ReadingView → 모드 고정
                                                       ↑ 바꾸려면 새로고침
```

- `App.tsx`에서 `mode`를 `useState`로 관리 → 온보딩에서 1회 설정, 이후 변경 UI 없음
- `ReadingView`는 `mode` prop을 받아 `useProvocationFlow`에 전달
- 모드를 바꾸려면 앱 새로고침 필요 (기존 세션 흐름 끊김)

### 문제

읽다 보면 모드를 바꾸고 싶어지는 게 자연스러움:

- 1장: **이해** 모드 (기본 개념 잡기)
- 3장: **시험** 모드 (연습문제 구간)
- 5장: **비판** 모드 (저자 주장 뜯기)

모드가 질문 스타일을 결정하므로, 고정하면 학습 효과가 제한됨.

### 해결 방안

| #     | 방향                                  | 설명                                                         | 노력  | 추천       |
| ----- | ------------------------------------- | ------------------------------------------------------------ | ----- | ---------- |
| **A** | NavBar 모드 배지 클릭 → 드롭다운 전환 | NavBar에 이미 모드 표시 있음. 클릭하면 4개 모드 드롭다운     | **S** | ✅ Phase 1 |
| **B** | FloatingToolbar에 모드 포함           | 텍스트 선택 시 Intent + Mode 동시 선택                       | M     | Phase 2    |
| **C** | AI 자동 판단                          | 모드 제거. AI가 intent + 컨텍스트 보고 질문 스타일 자동 결정 | L     | Phase 2+   |

#### 추천 구현: A (NavBar 모드 전환)

```
┌──────────────────────────────────────────┐
│ 📖 책제목.pdf   [이해 ▾]   p.12    ⚙️    │  ← 모드 배지 클릭
│                  ┌──────────┐            │
│                  │ ✓ 이해    │            │
│                  │   적용    │            │
│                  │   시험    │            │
│                  │   비판    │            │
│                  └──────────┘            │
└──────────────────────────────────────────┘
```

**코드 변경:**

1. `App.tsx`: `mode`를 state로 유지하되, `setMode`를 `ReadingView`에 전달
2. `ReadingView`: `onModeChange` prop 추가 → `NavBar`에 전달
3. `NavBar`: 모드 배지를 클릭 가능하게 → 드롭다운 → `onModeChange(newMode)` 호출
4. 모드 변경 시 현재 도발 플로우 리셋 (`flow.reset()`)

**주의:** 진행 중인 도발이 있을 때 모드 전환하면 → 경고 토스트 "진행 중인 도발이 있습니다. 전환하시겠습니까?"

#### 장기 방향: C (AI 자동 판단)

온보딩 모드 선택 = "기본 성향" 정도로 남기고, AI가 하이라이트 컨텍스트 + intent 기반으로 질문 종류를 자동 결정. 사용자가 생각할 것을 줄이는 게 RP 철학에 맞음.

---

## 이슈 3: PDF 콘텐츠 읽기 방식

### 현재 플로우

```
사용자가 PDF 파일 선택 (드래그 or 클릭 or 샘플)
    ↓
usePdfState.handleFileSelect(file)
    ↓
URL.createObjectURL(file) → blob URL 생성
    ↓
PdfViewer에 fileUrl 전달
    ↓
┌──────────────────────────────────────────────────────┐
│ PdfViewer 내부                                        │
│                                                      │
│ 1. react-pdf <Document file={fileUrl}>               │
│    → PDF.js가 blob URL로 PDF 로드                     │
│    → <Page pageNumber={currentPage}>                 │
│       → renderTextLayer={true}  ← 텍스트 레이어 렌더   │
│       → renderAnnotationLayer={true}                 │
│                                                      │
│ 2. useEffect → pdfjs-dist 텍스트 추출                  │
│    → getDocument(fileUrl)                            │
│    → doc.getPage(currentPage)                        │
│    → page.getTextContent()                           │
│    → items.map(item => item.str).join(" ")           │
│    → onPageTextExtract(text)  ← pageText 상태 업데이트 │
│                                                      │
│ 3. onMouseUp → window.getSelection()                 │
│    → 사용자가 텍스트 레이어에서 드래그 선택               │
│    → onTextSelect(text, position)                    │
└──────────────────────────────────────────────────────┘
    ↓
AI 도발 생성 시:
    selectedText (사용자가 선택한 텍스트)
    + pageText (현재 페이지 전체 텍스트)
    ↓
extractContext(selectedText, pageText)
    → selectedText 위치 찾기
    → 앞뒤 ±800자 추출 = contextExcerpt
    → 못 찾으면 pageText 앞 1500자 fallback
    ↓
prompts.ts에서 도발 프롬프트 구성:
    system: 모드 + intent + 규칙
    user: contextExcerpt + selectedText + 질문 요청
```

### 핵심 포인트

| 항목                     | 현재 동작                                        |
| ------------------------ | ------------------------------------------------ |
| **읽는 범위**            | 현재 페이지만 (전체 책 X)                        |
| **텍스트 추출**          | pdfjs-dist `getTextContent()` — PDF 내장 텍스트  |
| **선택 방식**            | 브라우저 네이티브 텍스트 선택 (TextLayer 위에서) |
| **AI에게 주는 컨텍스트** | 선택 텍스트 ±800자 (전체 페이지 아님)            |
| **페이지 전환 시**       | 새 페이지 텍스트 자동 추출                       |
| **이미지/수식**          | ❌ 추출 안 됨 (텍스트만)                         |
| **스캔 PDF**             | ❌ OCR 없음 → 텍스트 없는 PDF는 도발 불가        |
| **전체 책 맥락**         | ❌ 이전 페이지 내용 모름                         |

### 한계와 개선 방향

| #   | 한계                   | 영향                                 | 개선 방향                                    | Phase |
| --- | ---------------------- | ------------------------------------ | -------------------------------------------- | ----- |
| 1   | **현재 페이지만 읽음** | AI가 "3페이지 전에 나온 개념"을 모름 | 챕터 단위 텍스트 캐싱 (페이지 범위 지정)     | P2    |
| 2   | **이미지/수식 무시**   | 물리학/수학 교재에서 핵심 누락       | PDF.js annotation 추출 or 이미지→텍스트 변환 | P3    |
| 3   | **스캔 PDF 미지원**    | 오래된 교재 사용 불가                | Tesseract.js OCR (브라우저 WASM)             | P3    |
| 4   | **±800자 컨텍스트**    | 긴 논증의 맥락 유실                  | 동적 컨텍스트 크기 (토큰 기반 조절)          | P2    |
| 5   | **전체 책 모름**       | "앞서 나온 X와 비교해봐" 불가        | Book Memory: 챕터별 핵심 개념 누적 기록      | P2    |

#### Book Memory 컨셉 (Phase 2)

```
챕터 1 읽기 → AI가 핵심 개념 3개 추출 → bookMemory에 저장
챕터 2 읽기 → 도발 생성 시 bookMemory 참조
    → "1장에서 배운 X랑 여기 Y는 어떤 관계야?"
    → cross-chapter 도발 가능!
```

이건 PRD Phase 2 "책 메모리 그래프"와 연결됨.

---

## 우선순위 정리

| #      | 이슈                                 | 노력 | 우선         | 의존성           |
| ------ | ------------------------------------ | ---- | ------------ | ---------------- |
| **1A** | NavBar 모드 전환                     | S    | 🔴 즉시      | 없음             |
| **2**  | 멀티 프로바이더 (OpenAI + DashScope) | M    | 🟡 Phase 1.5 | CORS 검증 후     |
| **1C** | AI 자동 모드 판단                    | L    | 🟢 Phase 2+  | 사용 데이터 필요 |
| **3**  | Book Memory (전체 책 맥락)           | L    | 🟢 Phase 2   | 챕터 감지 필요   |

---

_MUSE 💡 — 2026-03-09_
