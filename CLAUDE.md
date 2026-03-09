# CLAUDE.md — RP Phase 2 코드리뷰 반영 (2026-03-09)

## 프로젝트
- 경로: ~/Projects/reading-provocateur
- 브랜치: master
- 현재: 194 tests (25 files) + 8 E2E, tsc 0 errors
- 이미 반영됨: FlowContext useMemo, showAnswer try/catch, callWithJsonRetry 네트워크 분기

## TDD 규칙
- Red → Green → Refactor, 각 Fix 완료 시 npm test + tsc --noEmit 통과 후 개별 커밋

---

## 반영할 코드리뷰 피드백 (아키텍처 + 테스트 합산)

### Fix 1: URL.revokeObjectURL 추가 — 메모리 누수 방지

**위치**: `src/hooks/usePdfState.ts`
**문제**: `URL.createObjectURL(file)` 후 revokeObjectURL 호출 없음 → blob URL 메모리 누수

**수정**:
```typescript
const handleFileSelect = (file: File) => {
  if (fileUrl) URL.revokeObjectURL(fileUrl); // 이전 URL 해제
  const url = URL.createObjectURL(file);
  setFileUrl(url);
  // ...
};
// cleanup: useEffect return에서도 revokeObjectURL
useEffect(() => {
  return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
}, [fileUrl]);
```

**테스트 (1개)**: fileUrl 변경 시 이전 URL revokeObjectURL 호출 확인 (vi.spyOn(URL, 'revokeObjectURL'))

**커밋**: `fix: revoke blob URL on file change to prevent memory leak`

---

### Fix 2: 샘플 PDF 2-step UX 버그 수정

**위치**: `src/views/ReadingView.tsx` 또는 App.tsx의 onSampleClick 핸들러
**문제**: 샘플 PDF 버튼 클릭 시 뷰 전환만 되고 실제 PDF 로드 안 됨

**수정**: onSampleClick 핸들러에서 fetch('/sample.pdf') → blob → createObjectURL → setFileUrl:
```typescript
const handleSampleClick = async () => {
  try {
    const res = await fetch('/sample.pdf');
    const blob = await res.blob();
    const file = new File([blob], 'sample.pdf', { type: 'application/pdf' });
    pdf.handleFileSelect(file);
  } catch (err) {
    console.warn('[sample] Failed to load sample PDF:', err);
  }
};
```

**테스트 (1개)**: 샘플 버튼 클릭 → fetch('/sample.pdf') 호출 + fileUrl 설정 확인

**커밋**: `fix: sample PDF button now actually loads the PDF`

---

### Fix 3: FileDropZone onSampleClick 빈 파일 fallback 제거

**위치**: `src/components/FileDropZone.tsx` 또는 호출부
**문제**: catch에서 빈 File 생성하는 의미 없는 fallback이 있으면 제거

**수정**: catch에서 에러만 로그하고 빈 파일 생성하지 않음. 사용자에게 에러 표시.

**커밋**: `fix: remove meaningless empty file fallback in sample PDF handler`

---

### Fix 4: 이중 재시도 로직 DRY 정리

**위치**: `src/lib/anthropic-provider.ts` + `src/lib/generate-provocation.ts` (또는 evaluate-answer.ts)
**문제**: callWithJsonRetry가 provider에도 있고 lib에도 있음 → 동일 로직 중복

**수정**: 재시도 로직을 한 곳에만 유지. provider에서 callWithJsonRetry 사용 시 lib 함수는 단순 호출만. 또는 lib에서 provider.generate를 직접 호출하고 재시도는 provider 내부에서만.

**확인 필요**: 실제 코드에서 중복 위치를 정확히 파악 후 판단. 중복이 아니면 skip.

**커밋**: `refactor: consolidate retry logic — single source of truth`

---

### Fix 5: E2E 샘플 PDF 테스트 — vacuous test 수정

**위치**: `e2e/kill-test.spec.ts`
**문제**: isVisible catch → 항상 pass. 의미 없는 테스트.

**수정**: catch 내에서 `test.skip('sample PDF not available')` 또는 제대로 된 assertion으로 교체.

**커밋**: `fix: remove vacuous isVisible catch in E2E sample test`

---

### Fix 6: E2E API 에러 테스트 — 실제 호출 추가

**위치**: `e2e/kill-test.spec.ts`
**문제**: route mock만 세팅하고 실제 API 호출을 트리거하는 사용자 액션이 없음

**수정**: mock 설정 후 텍스트 선택 → intent 클릭 → 도발 생성 시도 → 에러 UI 확인까지 추가.
실제 PDF 텍스트 선택이 어려우면 CustomEvent dispatch 사용.

**커밋**: `fix: E2E API error test now triggers actual API call`

---

### Fix 7: E2E 킬 테스트 — 실제 도발 플로우 검증 강화

**위치**: `e2e/kill-test.spec.ts`
**문제**: 90초 킬 테스트가 이름과 달리 실제 AI 플로우 절반도 미검증

**수정**: 전체 플로우를 순서대로 검증:
1. PDF 로드 확인
2. 텍스트 선택 (또는 CustomEvent)
3. Intent 선택 → SidePanel loading
4. 도발 질문 표시 확인
5. 답변 입력 + 제출
6. 평가 결과 표시 확인
7. (선택) 재시도 or 모범 답안
8. Export 가능 확인

각 단계에서 의미 있는 assertion 추가.

**커밋**: `test: strengthen kill test with full provocation flow assertions`

---

### Fix 8: `history.length >= 0` 등 무의미한 assertion 정리

**위치**: 테스트 파일 전체 스캔
**문제**: `>= 0`은 항상 true → 무의미한 assertion

**수정**: 구체적 값으로 교체 (예: `history.length === 0` 또는 `history.length > 0`)

**커밋**: `fix: replace vacuous assertions with meaningful checks`

---

### Fix 9: 세션 영속성 테스트 추가

**위치**: 신규 E2E 테스트
**문제**: reload 후 세션 복원 미검증

**수정**: E2E 테스트 추가:
1. 도발 진행 중 page.reload()
2. reload 후 이전 상태 복원 확인 (localStorage 기반)

**커밋**: `test: add session persistence E2E — reload restores state`

---

## 완료 기준

```bash
npm test              # 전체 통과 (194+)
npx tsc --noEmit      # 0 errors
npm run build         # 성공
npx playwright test   # E2E 전체 통과
```

## 완료 후

```bash
openclaw system event --text "Done: RP review fixes — all items addressed" --mode now
```
