---
tags:
  - 주제/RP
  - 타입/로드맵
  - 상태/현행
created: 2026-03-09
updated: 2026-03-09
---

# Reading Provocateur — 개발 현황 및 로드맵

> AI가 던지는 도발적 질문으로 수동적 읽기를 능동적 학습으로 전환하는 웹 앱
> 레포: `~/Projects/reading-provocateur` (GitHub: flowkater/reading-provocateur)

---

## 📊 현재 상태 (2026-03-09)

| 항목 | 값 |
|------|-----|
| **Unit Tests** | 239 passed (36 files) |
| **E2E Tests** | 12 passed (Playwright) |
| **tsc** | 0 errors |
| **Build** | 255 modules, 1.73s |
| **소스 코드** | ~8,000줄 |
| **스택** | Vite 6 + React 19 + TypeScript + Tailwind CSS 4 |

---

## ✅ 완료된 Phase

### Phase 1: Learning-first Kill Demo ✅

| 기능 | 상태 | 커밋 |
|------|------|------|
| 세션 모드 선택 (이해/적용/시험/비판) | ✅ | - |
| PDF 렌더링 (react-pdf 10.4.1) | ✅ | `55bf79a` |
| 70:30 Split 레이아웃 | ✅ | `3a76592` |
| FloatingToolbar → Intent 선택 | ✅ | - |
| AI 도발 생성 (Claude) | ✅ | - |
| 답변 평가 (4분류 verdict) | ✅ | - |
| 모범 답안 생성 | ✅ | - |
| Error Loop (1회 재시도) | ✅ | - |
| 약점 기록 (ReviewItem) | ✅ | - |
| Export 마크다운 | ✅ | - |
| localStorage 저장 | ✅ | - |
| SettingsDialog (API Key) | ✅ | - |
| ErrorBoundary | ✅ | `81e0de2` |
| a11y (aria-label, role) | ✅ | `b78bec5` |

### Phase 2: 웹 아티클 지원 ✅

| 기능 | 상태 | 커밋 |
|------|------|------|
| URL → 아티클 파싱 (@mozilla/readability) | ✅ | `0162573` |
| ArticleViewer (sanitized HTML) | ✅ | `b5e41e2` |
| ContentSelector (PDF/URL 탭) | ✅ | `bb7d23c` |
| useContentState 통합 | ✅ | `37983ff` |
| DOMPurify XSS 방어 (화이트리스트) | ✅ | - |
| CORS 프록시 fallback | ✅ | - |
| E2E 아티클 플로우 | ✅ | `8f856e9` |

### A+ 등급 수정 ✅

| 수정 | 커밋 |
|------|------|
| dead code 삭제 (usePdfState.ts) | `17c4ce9` |
| selection-mock 공유 유틸 | `17c4ce9` |
| DOMPurify 통합 테스트 | `17c4ce9` |
| README 전면 재작성 | `cc9f64e` |

---

## ⏳ 남은 Phase

### Phase 1.5: Meta-cognition 강화 (~1주)

PRD 기준: 학습 효과 극대화를 위한 메타인지 기능

| # | 기능 | 설명 | 난이도 |
|---|------|------|--------|
| 1-5.1 | **Interruption Budget** | 세션당 도발 횟수 제한 (과도한 개입 방지) | S |
| 1-5.2 | **확신도 슬라이더** | 답변 전 "얼마나 확신하는가" 3단계 (low/medium/high) | S |
| 1-5.3 | **[다른 도발] 버튼** | 현재 질문이 마음에 안 들면 재생성 | S |
| 1-5.4 | **킬 테스트 90초 E2E** | 실제 PDF → 선택 → 도발 → 평가 전체 플로우 | M |

### Phase 2: Memory Engine (~2주)

PRD 기준: 다음 세션에서 약점 리뷰

| # | 기능 | 설명 | 난이도 |
|---|------|------|--------|
| 2-1 | **다음 세션 리뷰 카드** | 세션 시작 시 어제 약점 지연 회상 | M |
| 2-2 | **IndexedDB 마이그레이션** | localStorage → IndexedDB (용량 확장) | M |
| 2-3 | **책별 히스토리** | 책 ID 기준 도발 기록 분리 | S |
| 2-4 | **약점 해소 추적** | weak → resolved 전환 기록 | S |
| 2-5 | **챕터 감지 / TOC** | PDF 목차 파싱 + 챕터별 진행률 | L |

### Phase 3: Reader 완성 (~3주)

PRD 기준: 멀티 포맷 + 고급 UX

| # | 기능 | 설명 | 난이도 |
|---|------|------|--------|
| 3-1 | **다중 하이라이트 색상** | Intent별 색상 구분 | S |
| 3-2 | **EPUB 지원** | epub.js 통합 | L |
| 3-3 | **라이브러리 뷰** | 책 목록 + 통계 대시보드 | M |
| 3-4 | **도발 톤 슬라이더** | 부드러움 ↔ 도발적 조절 | S |
| 3-5 | **PDF 주석 동기화** | 하이라이트 → PDF 주석으로 저장 | L |

### Phase 4: 확장 (~4주+)

PRD 기준: 외부 연동 + 고급 기능

| # | 기능 | 설명 | 난이도 |
|---|------|------|--------|
| 4-1 | **Todait 연동** | 학습 플래너와 도발 기록 동기화 | L |
| 4-2 | **Anki Export** | 약점 → Anki 플래시카드 | M |
| 4-3 | **Web Crypto 암호화** | API Key 암호화 저장 | M |
| 4-4 | **CF Worker 프록시** | 프로덕션 CORS 해결 | S |
| 4-5 | **PWA 오프라인** | Service Worker + 캐시 | L |

---

## 🎯 우선순위 권장

### 즉시 실행 가능 (Low Effort, High Impact)

1. **CF Worker CORS 프록시** (4-4) — Vercel 배포 전 필수
2. **확신도 슬라이더** (1-5.2) — 메타인지 핵심
3. **[다른 도발] 버튼** (1-5.3) — UX 개선

### 다음 스프린트

1. **다음 세션 리뷰 카드** (2-1) — Memory Engine 핵심
2. **IndexedDB** (2-2) — 확장성

### 배포 차단 요소

| 항목 | 상태 | 필요 작업 |
|------|------|----------|
| CORS | ⚠️ | CF Worker 프록시 배포 or `dangerouslyAllowBrowser` 유지 (개인용) |
| API Key 보안 | ⚠️ | 브라우저 노출 경고 README에 있음. 프로덕션은 서버 프록시 필요 |
| 샘플 PDF | ✅ | `public/sample.pdf` 존재 |

---

## 📁 관련 문서

- [[PRD]] — 원본 기획서
- [[UI-Layout]] — 레이아웃 설계
- [[Mega Plan Review (2026-03-09)]] — MUSE 리뷰
- [[RP 웹 아티클 지원 구현 계획서]] — Phase 2 상세
- [[Architecture Critique Review (2026-03-09)]] — 아키텍처 리뷰
- [[Test Strategy Critique (2026-03-09)]] — 테스트 리뷰

---

## 🔧 개발 명령어

```bash
# 로컬 실행
cd ~/Projects/reading-provocateur
npm run dev
# → http://localhost:5173

# 테스트
npm test              # Unit (Vitest)
npx playwright test   # E2E

# 빌드
npm run build
npm run preview
```

---

## 📈 테스트 추이

| 시점 | Unit | E2E | 비고 |
|------|------|-----|------|
| Phase 1 완료 | 167 | 5 | 로직 완성 |
| Fix Plan 완료 | 196 | 8 | PDF 통합 |
| A+ Push | 210 | 10 | ErrorBoundary, a11y |
| Phase 2 완료 | 238 | 12 | 웹 아티클 |
| Minor Fixes | **239** | **12** | 현재 |

---

*마지막 업데이트: 2026-03-09 15:30 KST*
