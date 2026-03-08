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

export interface Annotation {
  id: string;
  bookId: string;
  pageNumber: number;
  selectedText: string;
  highlightAreas: HighlightArea[];
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

export interface Settings {
  provider: "anthropic";
  apiKey: string;
  rememberKey: boolean;
  model: "claude-sonnet-4-6" | "claude-haiku-4-5";
  defaultMode: SessionMode;
  obsidianFrontmatter: boolean;
}
