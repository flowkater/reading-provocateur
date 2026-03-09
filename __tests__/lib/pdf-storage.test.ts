import { beforeEach, describe, expect, it } from "vitest";
import {
  deletePdfBlob,
  getPdfBlob,
  getPdfBlobByFingerprint,
  pruneStoredPdfs,
  savePdfBlob,
  touchPdfBlob,
} from "../../src/lib/pdf-storage";

class FakeIDBRequest<T> {
  onsuccess: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  result!: T;
  error: Error | null = null;

  constructor(executor: () => T) {
    queueMicrotask(() => {
      try {
        this.result = executor();
        this.onsuccess?.(new Event("success"));
      } catch (error) {
        this.error = error as Error;
        this.onerror?.(new Event("error"));
      }
    });
  }
}

class FakeObjectStore {
  constructor(private records: Map<string, Record<string, unknown>>) {}

  put(value: Record<string, unknown>) {
    return new FakeIDBRequest(() => {
      this.records.set(String(value.id), value);
      return value.id;
    });
  }

  get(key: string) {
    return new FakeIDBRequest(() => this.records.get(key) ?? null);
  }

  getAll() {
    return new FakeIDBRequest(() => Array.from(this.records.values()));
  }

  delete(key: string) {
    return new FakeIDBRequest(() => {
      this.records.delete(key);
      return undefined;
    });
  }
}

class FakeTransaction {
  constructor(private records: Map<string, Record<string, unknown>>) {}

  objectStore() {
    return new FakeObjectStore(this.records);
  }
}

class FakeDatabase {
  private records = new Map<string, Record<string, unknown>>();
  objectStoreNames = {
    contains: () => true,
  };

  createObjectStore() {
    return new FakeObjectStore(this.records);
  }

  transaction() {
    return new FakeTransaction(this.records);
  }
}

beforeEach(() => {
  const database = new FakeDatabase();

  globalThis.indexedDB = {
    open: () => {
      const request = new FakeIDBRequest(() => database as unknown as IDBDatabase) as FakeIDBRequest<
        IDBDatabase
      > & {
        onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null;
      };
      request.onupgradeneeded = null;
      queueMicrotask(() => {
        request.result = database as unknown as IDBDatabase;
        request.onupgradeneeded?.(new Event("upgradeneeded") as IDBVersionChangeEvent);
      });
      return request as unknown as IDBOpenDBRequest;
    },
  } as IDBFactory;
});

describe("pdf-storage", () => {
  it("blob 저장 후 다시 읽을 수 있다", async () => {
    const record = await savePdfBlob(new File(["pdf-data"], "book.pdf"));

    const blob = await getPdfBlob(record.id);

    expect(blob).not.toBeNull();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.size).toBe(8);
  });

  it("fingerprint로 기존 blob을 찾을 수 있다", async () => {
    const record = await savePdfBlob(new File(["pdf-data"], "book.pdf"));

    const found = await getPdfBlobByFingerprint(record.fingerprint);

    expect(found?.id).toBe(record.id);
  });

  it("touch 후 prune이 오래된 blob을 제거한다", async () => {
    const first = await savePdfBlob(new File(["1"], "1.pdf"));
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = await savePdfBlob(new File(["2"], "2.pdf"));

    await touchPdfBlob(second.id);
    const result = await pruneStoredPdfs(1);

    expect(result.deletedBlobIds).toEqual([first.id]);
    expect(await getPdfBlob(first.id)).toBeNull();
    expect(await getPdfBlob(second.id)).not.toBeNull();
  });

  it("blob 삭제가 된다", async () => {
    const record = await savePdfBlob(new File(["x"], "delete.pdf"));

    await deletePdfBlob(record.id);

    expect(await getPdfBlob(record.id)).toBeNull();
  });
});
