# Reading Provocateur

AI가 던지는 도발적 질문으로 수동적 읽기를 능동적 학습으로 전환하는 웹 앱.

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 브라우저에서 열기
open http://localhost:5173
```

## 📖 사용법

### 1. 홈 화면
- **최근 읽은 PDF** 목록에서 이어 읽기
- 새 PDF 파일 업로드 또는 웹 아티클 URL 입력
- 이전 세션 복원 카드에서 바로 이어서

### 2. 모드 선택
학습 목적에 맞는 모드 선택:
- **이해하기** — 개념 파악, 핵심 이해
- **적용하기** — 실제 상황에 적용
- **시험 대비** — 암기 및 재생
- **비판하기** — 논리적 분석

### 3. 콘텐츠 로드
- **PDF 파일**: 드래그앤드롭 또는 파일 선택 (IndexedDB에 저장, 재방문 시 복원)
- **웹 아티클**: URL 탭에서 링크 입력 → 불러오기 (Readability로 본문 추출)
- **일반 텍스트**: .txt 파일 드래그앤드롭
- **샘플 PDF**: "샘플로 시작하기" 클릭

### 4. 텍스트 선택 → 도발
1. 읽다가 중요한 부분 드래그 선택
2. 팝업에서 의도(Intent) 선택:
   - 🎯 **핵심** — 이 부분이 왜 중요한가?
   - ❓ **혼란** — 이해가 안 되는 부분
   - 🔗 **연결** — 다른 개념과 연결
   - 💡 **적용** — 실제로 어떻게 쓰나?
3. AI가 도발적 질문 생성
4. 답변 작성 → 평가 받기 → 모범 답안 확인

### 5. 주석 & 하이라이트
- 텍스트 선택 후 주석(Annotation) 추가
- 주석 목록에서 확인/편집/삭제
- Export 시 주석도 함께 마크다운으로 출력

### 6. API Key 설정
⚙️ Settings에서 Anthropic API Key 입력 (Claude 사용)

## ⚠️ 보안 안내

이 앱은 브라우저에서 직접 Anthropic API를 호출합니다 (`dangerouslyAllowBrowser: true`).
- API 키가 브라우저 DevTools (Network 탭)에서 보임
- **개인용/로컬 개발 전용**으로 사용
- 프로덕션 배포 시 서버 프록시 (예: Cloudflare Worker) 설정 권장

## 🛠 개발

```bash
# 테스트 실행
npm test

# 타입 체크
npx tsc --noEmit

# E2E 테스트
npx playwright test

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 📁 프로젝트 구조

```
src/
├── App.tsx                    # 라우터 + 앱 진입점
├── components/
│   ├── HomeScreen.tsx         # 홈 — 최근 읽은 목록 + 새 파일
│   ├── ReadingView.tsx        # 메인 읽기 뷰 (70:30 분할)
│   ├── PdfViewer.tsx          # PDF 렌더링 (react-pdf)
│   ├── ArticleViewer.tsx      # 웹 아티클 (DOMPurify)
│   ├── PlainTextViewer.tsx    # 일반 텍스트 뷰어
│   ├── ContentSelector.tsx    # PDF/URL 선택 탭
│   ├── FloatingToolbar.tsx    # 텍스트 선택 시 팝업
│   ├── SidePanel.tsx          # 도발/평가/답변 패널
│   ├── AnnotationList.tsx     # 주석 목록
│   ├── RestoreSessionCard.tsx # 이전 세션 복원
│   ├── ErrorBoundary.tsx      # 렌더 에러 복원력
│   └── ...
├── hooks/
│   ├── useContentState.ts     # PDF/Article/Text 통합 상태
│   ├── useProvocationFlow.ts  # 도발 FSM (8 states)
│   └── useAnnotations.ts     # 주석 CRUD
├── lib/
│   ├── ai-provider.ts         # Anthropic SDK 래퍼
│   ├── article-parser.ts      # URL → 아티클 (Readability)
│   ├── pdf-storage.ts         # IndexedDB PDF 저장/복원
│   ├── reading-history.ts     # 읽기 기록 관리
│   ├── prompts.ts             # AI 프롬프트
│   ├── export.ts              # 마크다운 Export
│   └── store.ts               # API Key + 설정 저장
└── types/
    └── index.ts               # 타입 정의
```

## 🧪 테스트 현황

- **Unit**: 281 tests (44 files)
- **E2E**: 12 tests (Playwright)
- **Coverage**: 도발/평가/모범답안, PDF/Article/Text 렌더링, 주석, 읽기기록, Export, 세션 복원

## 📦 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Vite 6 + React 19 + TypeScript |
| Routing | react-router-dom |
| Styling | Tailwind CSS 4 |
| PDF | react-pdf 10.4.1 |
| PDF Storage | IndexedDB |
| Article | @mozilla/readability + DOMPurify |
| AI | @anthropic-ai/sdk (Claude) |
| Testing | Vitest + Testing Library + Playwright |

## 📄 라이선스

MIT
