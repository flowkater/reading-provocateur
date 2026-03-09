# CLAUDE.md — RP Phase 2: 웹 아티클 지원 (2026-03-09)

## 프로젝트
- 경로: ~/Projects/reading-provocateur
- 브랜치: master
- 현재: 210 tests (31 files) + 10 E2E, tsc 0 errors
- 스택: Vite 6 + React 19 + TypeScript + Tailwind CSS 4 + react-pdf 10.4.1 + Vitest + Playwright

## TDD 규칙
- Red → Green → Refactor
- 각 작업 완료 시 `npm test` + `npx tsc --noEmit` 통과 후 개별 커밋
- E2E 변경 시 `npx playwright test` 통과도 확인

## 목표: PDF와 동일한 도발 플로우를 웹 아티클에서도 사용

## 구현 계획서
~/Obsidian/flowkater/flowkater/Project/reading-provocateur/RP 웹 아티클 지원 구현 계획서.md 를 반드시 읽고 따를 것.

---

## 실행 순서 (Task 0은 스킵 — CF Worker는 별도 배포)

### Task 1: article-parser (URL → 아티클 파싱)

**의존성 설치:**
```bash
npm install @mozilla/readability dompurify @types/dompurify
```

**생성**: `src/lib/article-parser.ts`

핵심:
- `@mozilla/readability`의 `Readability` 사용, DOMParser로 HTML 파싱
- `fetchArticleHtml()`: 직접 fetch 시도 → 실패 시 CORS 프록시 fallback
- CORS 프록시 URL: `import.meta.env.VITE_CORS_PROXY_URL || '/cors-proxy'`
- **charCount** = `content.length` (한국어 대응, wordCount 아님)
- Readability.parse() null 반환 시 → `throw new Error('이 URL은 아티클로 인식되지 않습니다')`
- `crypto.randomUUID()` 사용 → jsdom에서 동작 확인

**테스트 (8개)**: `src/lib/article-parser.test.ts`
- Readability → `vi.mock("@mozilla/readability")`로 parse() 반환값 제어
- fetch → `vi.spyOn(global, "fetch")`

```
1. 유효한 HTML → title + content + charCount 추출
2. Readability parse() null → 에러 throw
3. 빈 textContent → 에러 throw
4. URL fetch 실패 → 에러 메시지
5. charCount === content.length
6. 직접 fetch 성공 → 프록시 미호출 (fetch 1회만 호출)
7. 직접 fetch CORS 실패 → 프록시 fallback 성공
8. 직접 + 프록시 모두 실패 → 에러
```

**커밋**: `feat: article parser — URL to structured article with Readability`

---

### Task 2: ArticleViewer 컴포넌트

**생성**: `src/components/ArticleViewer.tsx`

핵심:
- DOMPurify 화이트리스트 설정:
```typescript
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','br','ul','ol','li',
                 'blockquote','pre','code','em','strong','a','img','figure',
                 'figcaption','table','thead','tbody','tr','th','td','hr','span','div'],
  ALLOWED_ATTR: ['href','src','alt','title','class','id'],
  FORBID_TAGS: ['script','style','iframe','form','input','button'],
  FORBID_ATTR: ['onerror','onload','onclick','onmouseover'],
};
```
- `useMemo`로 sanitizedHtml 캐시
- `onMouseUp` → `window.getSelection()` → `onTextSelect(text, {x, y})`
- charCount + URL hostname 표시
- Newsprint 디자인: `font-headline`, `font-body`
- 빈 htmlContent → "본문을 표시할 수 없습니다" 메시지

**공유 유틸 생성**: `src/__test__/selection-mock.ts`
```typescript
export function mockSelection(text: string, rect?: Partial<DOMRect>) {
  // PdfViewer 테스트와 공유할 getSelection mock
}
```

**테스트 (5개)**: `src/components/ArticleViewer.test.tsx`
- DOMPurify → `vi.mock("dompurify")` — sanitize 호출 여부 검증
- getSelection → 공유 selection-mock 사용

```
1. 아티클 제목 + 본문 렌더링 (container.querySelector 사용)
2. 텍스트 선택 → onTextSelect (공유 mock)
3. DOMPurify.sanitize 호출 + PURIFY_CONFIG 전달 확인
4. charCount + hostname 표시
5. 빈 htmlContent → fallback 메시지
```

**커밋**: `feat: ArticleViewer component with sanitized HTML rendering`

---

### Task 3: ContentSelector — URL 입력 탭

**수정**: `src/components/FileDropZone.tsx` 확장 → ContentSelector

핵심:
- 기존 FileDropZone export 유지: `export { ContentSelector as FileDropZone }`
- 탭 UI: "PDF 파일" | "웹 아티클"
- `parseArticleFn` props 주입 (테스트 용이성), 기본값 = parseArticle
- URL 유효성 검사: `new URL(str)` + http/https 프로토콜만
- `<form onSubmit>` 사용 → Enter 키 submit 지원
- 로딩/에러 상태 관리

**타입 추가 (types/index.ts)**:
```typescript
export type ContentType = "pdf" | "article";
export interface Article { id, url, title, content, htmlContent, charCount, addedAt }
export type ContentSource = { type: "pdf"; book: Book; fileUrl: string } | { type: "article"; article: Article };
```

**테스트 (6개)**: `src/components/ContentSelector.test.tsx`
```
1. 탭 전환: PDF ↔ 웹 아티클
2. URL 입력 + 불러오기 → onArticleLoad 호출 (parseArticleFn mock)
3. 로딩 중 버튼 disabled
4. 에러 표시
5. Enter 키 submit
6. 잘못된 URL → 버튼 disabled
```

**커밋**: `feat: ContentSelector — URL input tab for web articles`

---

### Task 4: ReadingView + useContentState 통합

**수정**: `src/hooks/usePdfState.ts` → `src/hooks/useContentState.ts`

핵심:
- 공통 인터페이스: contentSource, pageText, selectedText, selectionPosition
- pdfState 분리: currentPage, totalPages, setCurrentPage, setTotalPages (PDF 전용)
- `handleArticleLoad(article)` 추가 → pageText = article.content
- ReadingView 분기: pdf → PdfViewer, article → ArticleViewer, null → ContentSelector
- NavBar: 아티클이면 title만, 페이지 번호 숨김
- BottomBar: 아티클이면 숨김 또는 진행률
- 기존 14곳+ 참조 수정
- `usePdfState.test.ts` → `useContentState.test.ts` 리네이밍 + 기존 테스트 유지

**테스트 (6개)**: 통합 테스트
```
1. PDF contentSource → PdfViewer
2. article contentSource → ArticleViewer
3. null → ContentSelector
4. handleArticleLoad → type "article" + pageText 설정
5. 아티클 텍스트 선택 → FloatingToolbar
6. 아티클 도발 생성 (extractContext 정상 동작)
```

**커밋**: `feat: integrate ArticleViewer into ReadingView — unified content flow`

---

### Task 5: E2E — 아티클 플로우

**수정**: `e2e/` 디렉토리에 추가

핵심:
- URL fetch → Playwright `page.route('**/cors-proxy**')` intercept로 HTML mock
- 텍스트 선택 → CustomEvent dispatch 또는 evaluate로 selection 시뮬레이션

**테스트 (2개 E2E)**:
```
1. 아티클 URL → 본문 표시 → 도발 플로우 (API route intercept)
2. URL fetch 실패 → 에러 표시
```

**커밋**: `test: article flow E2E — URL to provocation`

---

## 완료 기준

```bash
npm test              # ~237+ tests 통과
npx tsc --noEmit      # 0 errors
npm run build         # 성공
npx playwright test   # E2E 전체 통과 (12+)
```

## 완료 후

```bash
git push origin master
```
