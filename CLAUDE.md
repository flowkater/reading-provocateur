# CLAUDE.md — Reading Provocateur Fix Plan Phase 2 (2026-03-09)

## 프로젝트
- 경로: ~/Projects/reading-provocateur
- 브랜치: master
- 현재: 194 tests (25 files), tsc 0 errors
- 스택: Vite 6 + React 19 + TypeScript + Tailwind CSS 4 + react-pdf 10.4.1 + Vitest + Playwright
- 디자인: Newsprint — Playfair Display/Lora/Inter/JetBrains Mono, #F9F9F7/#111111/#CC0000

## 완료된 작업
- ✅ Fix 4: 더블클릭 방지
- ✅ Fix 5: 에러 분류 (SDK instanceof)
- ✅ Fix 6: localStorage 방어
- ✅ Fix 2: PDF 렌더링 + pageText 추출 (react-pdf 10.4.1, React 19 호환 확인됨)

## TDD 규칙
- Red → Green → Refactor
- 각 작업 완료 시 `npm test` + `npx tsc --noEmit` 전체 통과 확인 후 커밋
- 커밋 컨벤션: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`

---

## 남은 작업 순서

### Task 1: App.tsx 통합 — ReadingView 분리 (3~4시간)

#### 구조 변경 (God Component 방지)

현재 App.tsx는 placeholder. 아래 구조로 분리:

```
App.tsx (라우팅만, ~30줄)
  ├── OnboardingView.tsx (기존 온보딩 로직 이동)
  └── ReadingView.tsx (메인 뷰 — 상태 관리)
```

#### hooks/usePdfState.ts 생성 — PDF 상태 분리

```typescript
export function usePdfState() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageText, setPageText] = useState("");
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{x:number,y:number} | null>(null);
  // handlers: handleFileSelect, handleTextSelect, clearSelection
  return { ... };
}
```

#### ReadingView.tsx — 70:30 split, 모든 컴포넌트 연결

**중요**: 각 컴포넌트의 **실제 props 인터페이스**를 코드에서 확인 후 매핑할 것. 추정하지 말 것.

확인할 컴포넌트 props:
- `NavBar` — 실제 props 확인 (bookTitle? currentPage? onSettingsClick?)
- `BottomBar` — 실제 props 확인
- `FloatingToolbar` — **position: {x,y}** (rects가 아님!) + onProvoke + onHighlight + onClose
- `SidePanel` — state, provocation, modelAnswer, error, history, hasApiKey, onSubmitAnswer, onRetry, onSkip, onShowAnswer, onSave, onProvoke, onPageJump, onOpenSettings 등
- `FileDropZone` — onFileSelect, onSampleClick
- `SettingsDialog` — onClose
- `ExportPreview` — reviewItems, onClose

#### 반응형 (1024px 이하)

```css
/* 기본: 70:30 split */
.pdf-panel { @apply w-[70%]; }
.side-panel { @apply w-[30%] border-l; }

/* 태블릿 이하: SidePanel overlay */
@media (max-width: 1024px) {
  .pdf-panel { @apply w-full; }
  .side-panel { @apply fixed bottom-0 left-0 w-full h-[60vh]; }
}
```

Tailwind `max-lg:` 프리픽스 활용.

#### Settings 보안 경고

SettingsDialog에 추가:
```
⚠️ API Key는 브라우저에서 직접 Anthropic 서버로 전송됩니다. 개인용으로만 사용하세요.
```

#### 테스트 전략

App.tsx / ReadingView 테스트에서 하위 컴포넌트는 **vi.mock으로 stub**:
```typescript
vi.mock('../components/PdfViewer', () => ({ PdfViewer: (props: any) => <div data-testid="pdf-viewer" /> }));
vi.mock('../components/SidePanel', () => ({ SidePanel: (props: any) => <div data-testid="side-panel" /> }));
```

#### 테스트 (8개)
1. 온보딩에서 모드 선택 → ReadingView 전환
2. ReadingView에 NavBar/BottomBar 렌더링
3. FileDropZone 표시 (파일 없을 때)
4. 파일 드롭 → PdfViewer 렌더링 (mock)
5. 텍스트 선택 → FloatingToolbar 표시
6. Intent 선택 → flow.startProvocation 호출
7. Settings 버튼 → SettingsDialog 표시
8. 샘플 PDF 버튼 → fileUrl 설정

#### 커밋
```
feat: integrate all components — ReadingView with 70:30 split layout
```

---

### Task 2: 킬 테스트 E2E 확장 (2~3시간)

#### AI mock — Playwright route intercept (MSW 사용 안 함)

```typescript
await page.route('https://api.anthropic.com/v1/messages', async (route) => {
  const postData = route.request().postDataJSON();
  const systemMsg = Array.isArray(postData.system)
    ? postData.system.map((s: any) => s.text).join(' ')
    : postData.system || '';

  if (systemMsg.includes('provoc') || systemMsg.includes('도발')) {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        content: [{ type: 'text', text: '{"kind":"recall","question":"이 개념의 핵심 원리를 설명해보세요.","targetConcept":"테스트","whyThisMatters":"이해도 확인"}' }]
      })
    });
  } else if (systemMsg.includes('evaluat') || systemMsg.includes('평가')) {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        content: [{ type: 'text', text: '{"verdict":"partial","confidence":"medium","explanation":"부분적으로 맞습니다.","hint":"핵심을 다시 생각해보세요"}' }]
      })
    });
  } else {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        content: [{ type: 'text', text: '모범 답안: 핵심 원리는...' }]
      })
    });
  }
});
```

#### PDF 텍스트 선택

TextLayer 렌더링 후 실제 마우스 selection. 어려우면 CustomEvent dispatch 대안 사용.

#### 테스트 (4개)
1. 전체 플로우: 온보딩 → PDF 로드 → 텍스트 선택 → 도발 → 평가 → Export
2. API 에러 시 에러 UI 표시
3. Settings에서 API Key 입력 → 반영
4. 90초 이내 전체 플로우 완료

#### 커밋
```
test: full flow E2E with Playwright route intercept
```

---

### Task 3: 코드 리뷰 반영 (크리틱 피드백)

아래 항목들을 코드에서 확인하고 해당되면 수정:

1. **useProvocationFlow FlowContext 재생성 방지**: context 객체를 `useMemo`로 감싸기
2. **showAnswer() try/catch 확인**: 없으면 추가
3. **FileDropZone onSampleClick**: sample.pdf fetch + 처리 로직 확인
4. **callWithJsonRetry**: 네트워크 에러 시 불필요한 재시도 방지 — JSON 파싱 에러만 재시도하도록 분기 (optional)

각 수정마다 개별 커밋.

---

## 완료 기준

```bash
npm test              # 전체 통과 (~206+ tests)
npx tsc --noEmit      # 0 errors
npm run build         # 성공
npx playwright test   # E2E 통과
```

## 완료 후

```bash
openclaw system event --text "Done: RP Fix Plan Phase 2 — App integration + E2E + review fixes. Tests: $(npm test 2>&1 | grep 'Tests' | head -1)" --mode now
```
