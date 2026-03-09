import type {
  Book,
  Annotation,
  Provocation,
  ReviewItem,
  Settings,
  SessionContext,
} from "../types";

const KEYS = {
  books: "rp:books",
  annotations: "rp:annotations",
  provocations: "rp:provocations",
  reviewItems: "rp:reviewItems",
  settings: "rp:settings",
  apiKey: "rp:apiKey",
  sessions: "rp:sessions",
} as const;

function getJson<T>(storage: Storage, key: string, fallback: T): T {
  const raw = storage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setJson(storage: Storage, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[store] Failed to write ${key}:`, (err as Error).message);
    return false;
  }
}

// --- Books ---
export function saveBook(book: Book): void {
  const books = getJson<Book[]>(localStorage, KEYS.books, []);
  books.push(book);
  setJson(localStorage, KEYS.books, books);
}

export function getBooks(): Book[] {
  return getJson<Book[]>(localStorage, KEYS.books, []);
}

// --- Annotations ---
export function saveAnnotation(annotation: Annotation): void {
  const all = getJson<Annotation[]>(localStorage, KEYS.annotations, []);
  all.push(annotation);
  setJson(localStorage, KEYS.annotations, all);
}

export function getAnnotations(bookId: string): Annotation[] {
  return getJson<Annotation[]>(localStorage, KEYS.annotations, []).filter(
    (a) => a.bookId === bookId
  );
}

export function updateAnnotation(
  id: string,
  updates: Partial<Annotation>
): void {
  const all = getJson<Annotation[]>(localStorage, KEYS.annotations, []);
  const idx = all.findIndex((annotation) => annotation.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    setJson(localStorage, KEYS.annotations, all);
  }
}

export function deleteAnnotation(id: string): void {
  const all = getJson<Annotation[]>(localStorage, KEYS.annotations, []);
  setJson(
    localStorage,
    KEYS.annotations,
    all.filter((annotation) => annotation.id !== id)
  );
}

// --- Provocations ---
export function saveProvocation(provocation: Provocation): void {
  const all = getJson<Provocation[]>(localStorage, KEYS.provocations, []);
  all.push(provocation);
  setJson(localStorage, KEYS.provocations, all);
}

export function getProvocations(bookId: string): Provocation[] {
  return getJson<Provocation[]>(localStorage, KEYS.provocations, []).filter(
    (p) => p.bookId === bookId
  );
}

export function updateProvocation(
  id: string,
  updates: Partial<Provocation>
): void {
  const all = getJson<Provocation[]>(localStorage, KEYS.provocations, []);
  const idx = all.findIndex((p) => p.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    setJson(localStorage, KEYS.provocations, all);
  }
}

// --- ReviewItems ---
export function saveReviewItem(item: ReviewItem): void {
  const all = getJson<ReviewItem[]>(localStorage, KEYS.reviewItems, []);
  all.push(item);
  setJson(localStorage, KEYS.reviewItems, all);
}

export function getReviewItems(bookId: string): ReviewItem[] {
  return getJson<ReviewItem[]>(localStorage, KEYS.reviewItems, []).filter(
    (r) => r.bookId === bookId
  );
}

// --- Settings ---
const DEFAULT_SETTINGS: Settings = {
  provider: "anthropic",
  apiKey: "",
  rememberKey: false,
  model: "claude-sonnet-4-6",
  defaultMode: "understand",
  obsidianFrontmatter: false,
};

export function saveSettings(settings: Settings): void {
  const { apiKey, ...rest } = settings;
  setJson(localStorage, KEYS.settings, rest);

  try {
    if (settings.rememberKey) {
      localStorage.setItem(KEYS.apiKey, apiKey);
      sessionStorage.removeItem(KEYS.apiKey);
    } else {
      sessionStorage.setItem(KEYS.apiKey, apiKey);
      localStorage.removeItem(KEYS.apiKey);
    }
  } catch (err) {
    console.warn(`[store] Failed to write apiKey:`, (err as Error).message);
  }
}

export function getSettings(): Settings {
  const stored = getJson<Omit<Settings, "apiKey">>(
    localStorage,
    KEYS.settings,
    DEFAULT_SETTINGS
  );
  const apiKey =
    sessionStorage.getItem(KEYS.apiKey) ??
    localStorage.getItem(KEYS.apiKey) ??
    "";
  return { ...DEFAULT_SETTINGS, ...stored, apiKey };
}

// --- Sessions ---
export function saveSession(session: SessionContext): void {
  const all = getJson<SessionContext[]>(localStorage, KEYS.sessions, []);
  all.push(session);
  setJson(localStorage, KEYS.sessions, all);
}

export function getSession(bookId: string): SessionContext | null {
  const all = getJson<SessionContext[]>(localStorage, KEYS.sessions, []);
  return all.find((s) => s.bookId === bookId) ?? null;
}

export function updateSession(
  bookId: string,
  updates: Partial<SessionContext>
): void {
  const all = getJson<SessionContext[]>(localStorage, KEYS.sessions, []);
  const idx = all.findIndex((s) => s.bookId === bookId);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    setJson(localStorage, KEYS.sessions, all);
  }
}
