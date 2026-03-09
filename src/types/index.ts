// === Enums ===
export type SessionMode = "understand" | "apply" | "exam" | "critique";
export type HighlightIntent = "core" | "confused" | "connection" | "apply";
export type ProvocationKind = "recall" | "compression" | "misconception" | "challenge" | "transfer";
export type EvaluationVerdict = "correct" | "partial" | "incorrect" | "memorized";
export type ConfidenceLevel = "low" | "medium" | "high";

export type SidePanelState =
  | "empty"
  | "loading"
  | "question"
  | "evaluating"
  | "evaluation"
  | "modelAnswer"
  | "saved";

// === Entities ===
export interface Book {
  id: string;
  fileName: string;
  totalPages: number;
  currentPage: number;
  addedAt: string;
}

export interface SessionContext {
  bookId: string;
  mode: SessionMode;
  startedAt: string;
  endedAt: string | null;
  firstPage: number;
  lastPage: number;
}

export interface HighlightArea {
  pageIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export type SelectionData =
  | {
      contentType: "pdf";
      pageNumber: number;
      highlightAreas: HighlightArea[];
    }
  | {
      contentType: "article" | "text";
      pageNumber: 1;
      quote: string;
      contextBefore: string;
      contextAfter: string;
    };

export interface Annotation {
  id: string;
  bookId: string;
  pageNumber: number;
  contentType: ContentType;
  selectedText: string;
  highlightAreas?: HighlightArea[];
  quote?: string;
  contextBefore?: string;
  contextAfter?: string;
  intent: HighlightIntent | null;
  createdAt: string;
}

export interface Evaluation {
  verdict: EvaluationVerdict;
  whatWasRight: string[];
  missingPoints: string[];
  followUpQuestion: string | null;
  retryAnswer: string | null;
  retryVerdict: EvaluationVerdict | null;
  retryEvaluatedAt: string | null;
}

export interface Provocation {
  id: string;
  bookId: string;
  annotationId: string | null;
  pageNumber: number;
  selectedText: string | null;
  contextExcerpt: string;
  sessionMode: SessionMode;
  intent: HighlightIntent | null;
  kind: ProvocationKind;
  question: string;
  answer: string | null;
  confidence: ConfidenceLevel | null;
  createdAt: string;
  answeredAt: string | null;
  evaluation: Evaluation | null;
  modelAnswer: string | null;
}

export interface ReviewItem {
  id: string;
  bookId: string;
  conceptLabel: string;
  sourceProvocationId: string;
  status: "weak" | "pending-review" | "resolved";
  reviewPrompt: string;
  createdAt: string;
}

// === Content Types ===
export type ContentType = "pdf" | "article" | "text";

export interface Article {
  id: string;
  url: string;
  title: string;
  content: string;
  htmlContent: string;
  charCount: number;
  addedAt: string;
}

export interface PlainTextDocument {
  id: string;
  title: string;
  content: string;
  charCount: number;
  addedAt: string;
}

export interface RecentDocumentRecord {
  id: string;
  type: ContentType;
  title: string;
  addedAt: string;
  lastOpenedAt: string;
  lastSessionId: string;
  pdfMeta?: {
    fileName: string;
    pdfBlobId?: string;
    fingerprint: string;
    size: number;
    mimeType: string;
    persistedAt?: string;
  };
  articleSnapshot?: Article;
  textSnapshot?: PlainTextDocument;
}

export interface ReadingSessionRecord {
  id: string;
  documentId: string;
  documentType: ContentType;
  title: string;
  mode: SessionMode;
  startedAt: string;
  endedAt: string | null;
  currentPage: number;
  firstPage: number;
  lastPage: number;
  restorable: boolean;
  pdfResume?: {
    fileName: string;
    pdfBlobId?: string;
    fingerprint: string;
  };
  articleResume?: {
    articleId: string;
  };
  textResume?: {
    textId: string;
  };
}

export interface StoredPdfBlobRecord {
  id: string;
  blob: Blob;
  fileName: string;
  fingerprint: string;
  size: number;
  mimeType: string;
  createdAt: string;
  lastAccessedAt: string;
}

export type ContentSource =
  | { type: "pdf"; book: Book; fileUrl: string }
  | { type: "article"; article: Article }
  | { type: "text"; text: PlainTextDocument };

export interface Settings {
  provider: "anthropic";
  apiKey: string;
  rememberKey: boolean;
  model: "claude-sonnet-4-6" | "claude-haiku-4-5";
  defaultMode: SessionMode;
  obsidianFrontmatter: boolean;
}
