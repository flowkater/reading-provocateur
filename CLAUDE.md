# CLAUDE.md — RP A+ Grade Push (2026-03-09)

## 프로젝트
- 경로: ~/Projects/reading-provocateur
- 브랜치: master
- 현재: 196 tests (26 files) + 8 E2E, tsc 0 errors
- 스택: Vite 6 + React 19 + TypeScript + Tailwind CSS 4 + react-pdf 10.4.1 + Vitest + Playwright

## TDD 규칙
- Red → Green → Refactor
- 각 작업 완료 시 `npm test` + `npx tsc --noEmit` 통과 후 개별 커밋
- E2E 변경 시 `npx playwright test` 통과도 확인

## 목표: 아키텍처 A+ / 테스트 A+

---

## Phase 1: S 항목 (순서대로)

### 1. 샘플 PDF 로드 수정

**위치**: ReadingView.tsx 또는 App.tsx의 onSampleClick 핸들러
**문제**: 샘플 버튼 클릭 시 뷰 전환만, PDF 미로드
**수정**:
```typescript
const handleSampleClick = async () => {
  const res = await fetch('/sample.pdf');
  const blob = await res.blob();
  const file = new File([blob], 'sample.pdf', { type: 'application/pdf' });
  pdf.handleFileSelect(file);
};
```
**테스트 (1개)**: 샘플 클릭 → fetch + fileUrl 설정
**커밋**: `fix: sample PDF button loads actual PDF file`

---

### 2. ErrorBoundary 추가

**생성**: `src/components/ErrorBoundary.tsx`
```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return this.props.fallback || (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="font-headline text-2xl font-black mb-4">문제가 발생했습니다</h1>
          <p className="font-body text-[#666] mb-4">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
                  className="font-ui px-4 py-2 bg-[#111] text-white">
            다시 시도
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}
```
**적용**: App.tsx 최상위 + ReadingView 래핑
**테스트 (2개)**: 렌더 에러 시 fallback UI 표시 + 다시 시도 버튼 클릭 → 복원
**커밋**: `feat: add ErrorBoundary for render error resilience`

---

### 3. React.lazy PDF viewer 코드 분할

**수정**: ReadingView에서 PdfViewer를 lazy import:
```typescript
const PdfViewer = React.lazy(() => import('../components/PdfViewer').then(m => ({ default: m.PdfViewer })));
// 사용 시 <Suspense fallback={<LoadingCard />}><PdfViewer ... /></Suspense>
```
**테스트**: 기존 테스트 통과 확인 (lazy는 테스트에서 자동 resolve)
**커밋**: `perf: lazy load PdfViewer for code splitting`

---

### 4. `any` 캐스트 제거 — strict 타입

**수정**: 프로젝트 전체에서 `as any` 검색 → `unknown` + 타입 가드로 교체. 테스트 파일의 mock 관련 `any`는 허용.
**커밋**: `refactor: remove any casts — strict typing with type guards`

---

### 5. NavBar / BottomBar / FileDropZone 단위 테스트

각 컴포넌트의 **실제 props**를 코드에서 확인 후 테스트 작성.

**NavBar 테스트 (~3개)**:
1. 책 제목 렌더링
2. 페이지 번호 표시
3. Settings 버튼 클릭 → onSettingsClick 호출

**BottomBar 테스트 (~2개)**:
1. 현재 페이지 / 전체 페이지 표시
2. 진행률 표시

**FileDropZone 테스트 (~3개)**:
1. 드래그앤드롭 영역 렌더링
2. 파일 드롭 → onFileSelect 호출
3. 샘플 버튼 → onSampleClick 호출

**커밋**: `test: add NavBar, BottomBar, FileDropZone unit tests`

---

### 6. 세션 영속성 E2E

**위치**: `e2e/kill-test.spec.ts` 에 추가
**시나리오**:
1. 온보딩 → 모드 선택 → 메인 뷰 진입
2. API Key 설정
3. page.reload()
4. reload 후 메인 뷰 유지 + API Key 복원 확인

**커밋**: `test: add session persistence E2E — reload restores state`

---

### 7. Race condition 테스트

**위치**: `src/hooks/useProvocationFlow.test.ts`에 추가
**시나리오**: loading 상태에서 startProvocation 재호출 → 무시됨 (중복 호출 방지)
**커밋**: `test: verify concurrent provocation calls are rejected`

---

### 8. 빈 Export 테스트

**위치**: `src/lib/export.test.ts`에 추가
**시나리오**: reviewItems 빈 배열 → Export 마크다운에 "기록된 도발이 없습니다" 또는 빈 섹션
**커밋**: `test: empty export produces valid markdown`

---

## Phase 2: M 항목

### 9. E2E 전체 플로우 완전 검증

기존 E2E를 강화. 매 단계에서 의미 있는 assertion:

```
1. 온보딩 → 모드 선택 (버튼 클릭 확인)
2. 메인 뷰 전환 (NavBar 존재 확인)
3. PDF 로드 (sample PDF or 파일 업로드)
4. 텍스트 선택 → FloatingToolbar 표시
5. Intent 클릭 → SidePanel loading 상태
6. 도발 질문 텍스트 표시 (route intercept mock)
7. 답변 입력 + 제출
8. 평가 결과 표시 (verdict 텍스트 확인)
9. 재시도 or 모범 답안
10. Export 가능 확인
```

각 단계에서 `expect(locator).toBeVisible()` 또는 `toContainText()` 사용.
텍스트 선택이 어려우면 CustomEvent dispatch 사용.

**커밋**: `test: comprehensive E2E full provocation flow`

---

### 10. 접근성 (a11y)

주요 인터랙션 요소에 aria 속성 추가:
- 버튼: `aria-label` (아이콘 버튼)
- FloatingToolbar: `role="toolbar"` + `aria-label="텍스트 도구"`
- SidePanel: `role="complementary"` + `aria-label="도발 패널"`
- 답변 textarea: `aria-label="답변 입력"`
- 모달: `role="dialog"` + `aria-modal="true"`
- 키보드: Escape로 FloatingToolbar/Dialog 닫기

**테스트 (3개)**:
1. FloatingToolbar에 role="toolbar" 존재
2. Escape 키로 FloatingToolbar 닫기
3. SettingsDialog에 role="dialog" 존재

**커밋**: `feat: add accessibility — aria labels, roles, keyboard navigation`

---

## 완료 기준

```bash
npm test              # 전체 통과 (~215+ tests)
npx tsc --noEmit      # 0 errors
npm run build         # 성공
npx playwright test   # E2E 전체 통과
```

## 완료 후

```bash
openclaw system event --text "Done: RP A+ grade push — architecture + tests complete" --mode now
```
