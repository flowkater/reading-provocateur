import type {
  ReadingSessionRecord,
  RecentDocumentRecord,
} from "../types";

const KEYS = {
  recentDocuments: "rp:recentDocuments",
  readingSessions: "rp:readingSessions",
} as const;

function getJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function saveRecentDocument(document: RecentDocumentRecord): void {
  const documents = getJson<RecentDocumentRecord[]>(KEYS.recentDocuments, []);
  const next = [
    document,
    ...documents.filter((existing) => existing.id !== document.id),
  ].sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt));

  setJson(KEYS.recentDocuments, next);
}

export function listRecentDocuments(): RecentDocumentRecord[] {
  return getJson<RecentDocumentRecord[]>(KEYS.recentDocuments, []).sort((a, b) =>
    b.lastOpenedAt.localeCompare(a.lastOpenedAt)
  );
}

export function saveReadingSession(session: ReadingSessionRecord): void {
  const sessions = getJson<ReadingSessionRecord[]>(KEYS.readingSessions, []);
  const next = [
    session,
    ...sessions.filter((existing) => existing.id !== session.id),
  ].sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  setJson(KEYS.readingSessions, next);
}

export function updateReadingSession(
  id: string,
  updates: Partial<ReadingSessionRecord>
): void {
  const sessions = getJson<ReadingSessionRecord[]>(KEYS.readingSessions, []);
  const next = sessions.map((session) =>
    session.id === id ? { ...session, ...updates } : session
  );

  setJson(KEYS.readingSessions, next);
}

export function getReadingSession(id: string): ReadingSessionRecord | null {
  return (
    getJson<ReadingSessionRecord[]>(KEYS.readingSessions, []).find(
      (session) => session.id === id
    ) ?? null
  );
}

export function listReadingSessions(): ReadingSessionRecord[] {
  return getJson<ReadingSessionRecord[]>(KEYS.readingSessions, []).sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt)
  );
}

export function deleteRecentDocumentsByBlobIds(blobIds: string[]): void {
  if (blobIds.length === 0) return;

  const documents = getJson<RecentDocumentRecord[]>(KEYS.recentDocuments, []);
  const next = documents.filter(
    (document) => !document.pdfMeta?.pdfBlobId || !blobIds.includes(document.pdfMeta.pdfBlobId)
  );
  setJson(KEYS.recentDocuments, next);
}

export function deleteReadingSessionsByBlobIds(blobIds: string[]): void {
  if (blobIds.length === 0) return;

  const sessions = getJson<ReadingSessionRecord[]>(KEYS.readingSessions, []);
  const next = sessions.filter(
    (session) => !session.pdfResume?.pdfBlobId || !blobIds.includes(session.pdfResume.pdfBlobId)
  );
  setJson(KEYS.readingSessions, next);
}
