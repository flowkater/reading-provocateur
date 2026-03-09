import type { StoredPdfBlobRecord } from "../types";

const DB_NAME = "reading-provocateur";
const DB_VERSION = 1;
const STORE_NAME = "pdfBlobs";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);

  try {
    return await handler(store);
  } finally {
    db.close?.();
  }
}

export function computePdfFingerprint(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export async function getPdfBlobByFingerprint(
  fingerprint: string
): Promise<StoredPdfBlobRecord | null> {
  return withStore("readonly", async (store) => {
    const records = (await requestToPromise(store.getAll())) as StoredPdfBlobRecord[];
    return records.find((record) => record.fingerprint === fingerprint) ?? null;
  });
}

export async function savePdfBlob(file: File): Promise<StoredPdfBlobRecord> {
  const fingerprint = computePdfFingerprint(file);
  const existing = await getPdfBlobByFingerprint(fingerprint);

  if (existing) {
    await touchPdfBlob(existing.id);
    return {
      ...existing,
      lastAccessedAt: new Date().toISOString(),
    };
  }

  const now = new Date().toISOString();
  const record: StoredPdfBlobRecord = {
    id: crypto.randomUUID(),
    blob: file,
    fileName: file.name,
    fingerprint,
    size: file.size,
    mimeType: file.type || "application/pdf",
    createdAt: now,
    lastAccessedAt: now,
  };

  await withStore("readwrite", async (store) => {
    await requestToPromise(store.put(record));
  });

  return record;
}

export async function getPdfBlob(blobId: string): Promise<Blob | null> {
  return withStore("readonly", async (store) => {
    const record = (await requestToPromise(
      store.get(blobId)
    )) as StoredPdfBlobRecord | null;
    return record?.blob ?? null;
  });
}

export async function touchPdfBlob(blobId: string): Promise<void> {
  await withStore("readwrite", async (store) => {
    const record = (await requestToPromise(
      store.get(blobId)
    )) as StoredPdfBlobRecord | null;
    if (!record) return;

    await requestToPromise(
      store.put({ ...record, lastAccessedAt: new Date().toISOString() })
    );
  });
}

export async function deletePdfBlob(blobId: string): Promise<void> {
  await withStore("readwrite", async (store) => {
    await requestToPromise(store.delete(blobId));
  });
}

export async function pruneStoredPdfs(
  keepLatest: number
): Promise<{ deletedBlobIds: string[] }> {
  return withStore("readwrite", async (store) => {
    const records = (await requestToPromise(store.getAll())) as StoredPdfBlobRecord[];
    const sorted = [...records].sort((a, b) =>
      b.lastAccessedAt.localeCompare(a.lastAccessedAt)
    );
    const removable = sorted.slice(keepLatest);

    await Promise.all(
      removable.map((record) => requestToPromise(store.delete(record.id)))
    );

    return {
      deletedBlobIds: removable.map((record) => record.id),
    };
  });
}
