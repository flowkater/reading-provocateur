# CLAUDE.md — Reading Provocateur Fix Plan (2026-03-09)

## 프로젝트
- 경로: ~/Projects/reading-provocateur
- 브랜치: master
- 현재: 167 unit + 5 E2E, tsc 0 errors, build 195KB
- 스택: Vite 6 + React 19 + TypeScript + Tailwind CSS 4 + Vitest + Playwright
- 디자인: Newsprint — Playfair Display / Lora / Inter / JetBrains Mono, #F9F9F7 / #111111 / #CC0000

## 핵심 문제
로직은 전부 완성(167 tests)되어 있으나 **조립이 안 됨**:
- App.tsx main 뷰 = placeholder ("PDF viewer coming soon")
- PdfViewer.tsx = placeholder (실제 PDF 렌더링 없음)
- NavBar/BottomBar/FloatingToolbar/SettingsDialog/ExportPreview 전부 미연결

## TDD 규칙
- Red → Green → Refactor
- 각 Fix 완료 시 `npm test` + `npx tsc --noEmit` 전체 통과 확인 후 커밋
- 커밋 컨벤션: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`

---

## 실행 순서 (순차 — Batch A 병렬은 오케스트레이터가 처리)

### Fix 4: 답변 더블클릭 방지 (5분)

`src/components/ProvocationCard.tsx`의 제출 버튼에 disabled 추가:
```typescript
<button
  disabled={isSubmitting}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
```

`isSubmitting` prop 추가 or state 활용. evaluating 상태에서 버튼 비활성화.

**테스트 (1개)**: evaluating 상태 → 제출 버튼 disabled

**커밋**: `fix: prevent double-click on answer submit button`

---

### Fix 5: 에러 메시지 분류 — SDK instanceof 기반 (30분)

`src/lib/error-classifier.ts` 생성:
```typescript
import { APIError, RateLimitError, AuthenticationError } from '@anthropic-ai/sdk';

export function classifyError(err: unknown): { message: string; type: string } {
  if (err instanceof AuthenticationError)
    return { message: 'API Key를 확인해주세요.', type: 'auth' };
  if (err instanceof RateLimitError)
    return { message: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.', type: 'rate-limit' };
  if (err instanceof TypeError && err.message?.includes('fetch'))
    return { message: '인터넷 연결을 확인해주세요.', type: 'network' };
  if (err instanceof APIError)
    return { message: `API 오류: ${err.message}`, type: 'api' };
  if (err instanceof Error)
    return { message: err.message, type: 'unknown' };
  return { message: '도발 생성에 실패했습니다.', type: 'unknown' };
}
```

`src/hooks/useProvocationFlow.ts`의 catch 블록에서 `classifyError()` 사용.

**테스트 (8개)** — `src/lib/error-classifier.test.ts`:
1. AuthenticationError → "API Key를 확인해주세요"
2. RateLimitError → "요청이 너무 많아요..."
3. TypeError (fetch) → "인터넷 연결을 확인해주세요"
4. APIError → "API 오류: ..."
5. 일반 Error → err.message
6. non-Error → "도발 생성에 실패했습니다"
7. SDK AuthenticationError 실제 인스턴스
8. SDK RateLimitError 실제 인스턴스

**커밋**: `feat: error classifier with Anthropic SDK error types`

---

### Fix 6: localStorage 쓰기 방어 (20분)

`src/lib/store.ts`의 `setJson()` 수정:
```typescript
export function setJson<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[store] Failed to write ${key}:`, (err as Error).message);
    return false;
  }
}
```

**테스트 (3개)**: 정상→true, 용량초과→false+warn, 차단→false

**커밋**: `fix: handle localStorage write failures gracefully`

---

### Fix 2: PDF 렌더링 + pageText 추출 (3~4시간) — 가장 큰 작업

#### Step 0: 5분 PoC
```bash
npm install react-pdf pdfjs-dist
# tsc --noEmit + 간단 <Document><Page> 렌더링 확인
# 실패 시 pdfjs-dist 직접 사용으로 전환
```

#### PdfViewer.tsx 재작성

**인터페이스** (현재 FloatingToolbar와 호환):
```typescript
interface PdfViewerProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
  onTextSelect: (text: string, position: { x: number; y: number }) => void;
  onPageTextExtract: (text: string) => void;
}
```

**핵심 구현:**
- react-pdf `<Document>` + `<Page>` with `renderTextLayer={true}`
- Worker 설정: `pdfjs.GlobalWorkerOptions.workerSrc`
- `onLoadSuccess` → `onTotalPagesChange(numPages)`
- `mouseup` → `window.getSelection()` → text + `rects[0]`에서 `{x: left, y: bottom}` 변환 → `onTextSelect`
- **pageText 추출** (필수!): `pdfjs-dist`의 `page.getTextContent()` → `items.map(i => i.str).join(' ')` → `onPageTextExtract`
  - 이것 없으면 `extractContext()`가 작동 불가 → 도발 생성 전체 불가능

**TextLayer CSS**: `import 'react-pdf/dist/Page/TextLayer.css'` + `import 'react-pdf/dist/Page/AnnotationLayer.css'`

**sample.pdf**: `public/sample.pdf` — 2~3페이지 기술 글

#### 테스트 mock 전략

jsdom에서 react-pdf 직접 테스트 불가 (canvas/worker 없음). Manual mock 필수:

```typescript
// src/__mocks__/react-pdf.tsx 또는 vi.mock inline
vi.mock('react-pdf', () => ({
  Document: ({ onLoadSuccess, children }: any) => {
    useEffect(() => onLoadSuccess?.({ numPages: 3 }), []);
    return <div data-testid="pdf-document">{children}</div>;
  },
  Page: ({ pageNumber }: any) => (
    <div data-testid={`pdf-page-${pageNumber}`}>Page {pageNumber}</div>
  ),
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}));
```

#### 테스트 (6개)
1. Document 로드 성공 → onTotalPagesChange 호출
2. 페이지 번호 전환 → Page 컴포넌트 렌더링
3. 텍스트 선택 → onTextSelect 콜백 (position 형식)
4. 잘못된 PDF URL → 에러 UI 표시
5. 빈 fileUrl은 App 레벨에서 FileDropZone 표시 (PdfViewer는 항상 fileUrl 있음)
6. 페이지 로드 → onPageTextExtract 호출

**커밋**: `feat: PDF rendering with react-pdf + page text extraction`

---

### Fix 3: App.tsx 통합 — ReadingView 분리 (3~4시간)

#### 구조 변경 (God Component 방지)

```
App.tsx (라우팅만, ~30줄)
  ├── OnboardingView.tsx (기존 온보딩 로직 이동)
  └── ReadingView.tsx (메인 뷰)
```

#### App.tsx (간결하게)
```typescript
function App() {
  const [view, setView] = useState<"onboarding" | "main">("onboarding");
  const [mode, setMode] = useState<SessionMode | null>(null);

  if (view === "onboarding") {
    return <OnboardingView onModeSelect={(m) => { setMode(m); setView("main"); }} />;
  }
  return <ReadingView mode={mode!} />;
}
```

#### hooks/usePdfState.ts — PDF 상태 분리
```typescript
export function usePdfState() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageText, setPageText] = useState("");
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{x:number,y:number} | null>(null);

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setBook({ id: crypto.randomUUID(), fileName: file.name, totalPages: 0, currentPage: 1, addedAt: new Date().toISOString() });
  };

  const handleTextSelect = (text: string, position: {x:number,y:number}) => {
    setSelectedText(text);
    setSelectionPosition(position);
  };

  const clearSelection = () => { setSelectedText(null); setSelectionPosition(null); };

  return { fileUrl, book, currentPage, setCurrentPage, totalPages, setTotalPages,
           pageText, setPageText, selectedText, selectionPosition,
           handleFileSelect, handleTextSelect, clearSelection };
}
```

#### ReadingView.tsx — 메인 뷰 조립

70:30 split 레이아웃. 모든 컴포넌트 연결:

```typescript
export function ReadingView({ mode }: { mode: SessionMode }) {
  const pdf = usePdfState();
  const settings = useSettings();
  const provider = useMemo(() => new AnthropicProvider(settings.apiKey, settings.model), [settings.apiKey, settings.model]);
  const flow = useProvocationFlow(provider);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col">
      <NavBar bookTitle={pdf.book?.fileName ?? ""} modeBadge={mode}
              currentPage={pdf.currentPage} totalPages={pdf.totalPages}
              onSettingsClick={() => setShowSettings(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* 70% PDF */}
        <div className="w-[70%] max-lg:w-full relative">
          {pdf.fileUrl ? (
            <PdfViewer fileUrl={pdf.fileUrl} currentPage={pdf.currentPage}
                       onPageChange={pdf.setCurrentPage} onTotalPagesChange={pdf.setTotalPages}
                       onTextSelect={pdf.handleTextSelect} onPageTextExtract={pdf.setPageText} />
          ) : (
            <FileDropZone onFileSelect={pdf.handleFileSelect}
                          onSampleClick={() => { pdf.handleFileSelect(/* sample.pdf fetch */); }} />
          )}
          {pdf.selectedText && pdf.selectionPosition && (
            <FloatingToolbar position={pdf.selectionPosition}
                             onProvoke={(intent) => { flow.startProvocation(pdf.selectedText!, intent, mode, ...); pdf.clearSelection(); }}
                             onHighlight={() => { /* highlight logic */ pdf.clearSelection(); }}
                             onClose={pdf.clearSelection} />
          )}
        </div>

        {/* 30% SidePanel */}
        <div className="w-[30%] max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:w-full max-lg:h-[60vh] border-l border-[#E0E0E0]">
          <SidePanel state={flow.state} provocation={flow.provocation}
                     modelAnswer={flow.modelAnswer} error={flow.error}
                     history={flow.history} hasApiKey={!!settings.apiKey}
                     onSubmitAnswer={flow.submitAnswer} onRetry={flow.submitRetry}
                     onSkip={flow.skipRetry} onShowAnswer={flow.showAnswer}
                     onSave={flow.saveAndNext} onProvoke={() => {}}
                     onPageJump={pdf.setCurrentPage} onOpenSettings={() => setShowSettings(true)} />
        </div>
      </div>

      <BottomBar currentPage={pdf.currentPage} totalPages={pdf.totalPages} progress={0} />

      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showExport && <ExportPreview reviewItems={[]} onClose={() => setShowExport(false)} />}
    </div>
  );
}
```

**주의**: SidePanel의 실제 props를 확인하고 매핑할 것. 위 코드는 가이드라인이며 실제 인터페이스에 맞춰 조정 필수.

**주의**: NavBar/BottomBar/FloatingToolbar/SidePanel 등의 실제 props 인터페이스를 코드에서 확인 후 사용. 위 코드와 다를 수 있음.

#### 반응형 (1024px 이하)

Tailwind `max-lg:` 프리픽스로 1024px 이하에서 SidePanel을 fixed overlay로 전환.

#### 테스트 전략

App.tsx / ReadingView 테스트에서 하위 컴포넌트는 vi.mock으로 stub:
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

**커밋**: `feat: integrate all components — ReadingView with 70:30 split layout`

---

### Fix 7: 킬 테스트 E2E 확장 (2~3시간)

#### AI mock — Playwright route intercept

```typescript
await page.route('https://api.anthropic.com/v1/messages', async (route) => {
  const postData = route.request().postDataJSON();
  const systemMsg = Array.isArray(postData.system)
    ? postData.system.map((s: any) => s.text).join(' ')
    : postData.system || '';

  if (systemMsg.includes('도발') || systemMsg.includes('provoc')) {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        content: [{ type: 'text', text: '{"kind":"recall","question":"이 개념의 핵심 원리를 설명해보세요.","targetConcept":"테스트 개념","whyThisMatters":"이해도 확인"}' }]
      })
    });
  } else if (systemMsg.includes('평가') || systemMsg.includes('evaluat')) {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        content: [{ type: 'text', text: '{"verdict":"partial","confidence":"medium","explanation":"부분적으로 맞지만...","hint":"핵심 원리를 다시 생각해보세요"}' }]
      })
    });
  } else {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        content: [{ type: 'text', text: '모범 답안: 이 개념의 핵심은...' }]
      })
    });
  }
});
```

#### PDF 텍스트 선택 — CustomEvent dispatch 또는 TextLayer 대기
E2E에서 실제 PDF selection이 어려우면 dev/test 전용 이벤트 dispatch 사용.

#### 테스트 (4개)
1. 전체 플로우: 온보딩 → PDF 로드 → 텍스트 선택 → 도발 → 평가 → Export
2. API 에러 시 에러 UI 표시
3. Settings에서 API Key 입력 → 반영
4. 90초 이내 전체 플로우 완료 (킬 테스트)

**커밋**: `test: full flow E2E with Playwright route intercept`

---

## Settings 보안 경고 (Fix 1 에서 추가)

SettingsDialog에 보안 경고 문구 추가:
```
⚠️ API Key는 브라우저에서 직접 Anthropic 서버로 전송됩니다. 개인용으로만 사용하세요.
```

**커밋**: `fix: add API key security warning to settings`

---

## 완료 기준

```bash
npm test          # 전체 통과 (~200 tests)
npx tsc --noEmit  # 0 errors
npm run build     # 성공
npx playwright test  # E2E 통과
```

## 완료 후

```bash
openclaw system event --text "Done: RP Fix Plan — PDF rendering + App integration + E2E. Tests: $(npm test 2>&1 | grep 'Tests' | head -1)" --mode now
```
