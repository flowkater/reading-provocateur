import { describe, it, expect, beforeEach } from "vitest";
import {
  saveBook,
  getBooks,
  saveAnnotation,
  getAnnotations,
  saveProvocation,
  getProvocations,
  updateProvocation,
  saveReviewItem,
  getReviewItems,
  saveSettings,
  getSettings,
  saveSession,
  getSession,
  updateSession,
} from "../../src/lib/store";
import type {
  Book,
  Annotation,
  Provocation,
  ReviewItem,
  Settings,
  SessionContext,
} from "../../src/types";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("store — Books", () => {
  it("saveBook → getBooks", () => {
    const book: Book = {
      id: "b1",
      fileName: "test.pdf",
      totalPages: 100,
      currentPage: 1,
      addedAt: new Date().toISOString(),
    };
    saveBook(book);
    const books = getBooks();
    expect(books).toHaveLength(1);
    expect(books[0].id).toBe("b1");
  });
});

describe("store — Annotations", () => {
  it("saveAnnotation → getAnnotations(bookId) 필터링", () => {
    const ann: Annotation = {
      id: "a1",
      bookId: "b1",
      pageNumber: 5,
      selectedText: "some text",
      highlightAreas: [],
      intent: "core",
      createdAt: new Date().toISOString(),
    };
    const ann2: Annotation = { ...ann, id: "a2", bookId: "b2" };
    saveAnnotation(ann);
    saveAnnotation(ann2);
    expect(getAnnotations("b1")).toHaveLength(1);
    expect(getAnnotations("b2")).toHaveLength(1);
  });
});

describe("store — Provocations", () => {
  const baseProv: Provocation = {
    id: "p1",
    bookId: "b1",
    annotationId: null,
    pageNumber: 10,
    selectedText: "text",
    contextExcerpt: "context",
    sessionMode: "understand",
    intent: "core",
    kind: "recall",
    question: "질문?",
    answer: null,
    confidence: null,
    createdAt: new Date().toISOString(),
    answeredAt: null,
    evaluation: null,
    modelAnswer: null,
  };

  it("saveProvocation → getProvocations(bookId) 필터링", () => {
    saveProvocation(baseProv);
    saveProvocation({ ...baseProv, id: "p2", bookId: "b2" });
    expect(getProvocations("b1")).toHaveLength(1);
    expect(getProvocations("b2")).toHaveLength(1);
  });

  it("updateProvocation: 답변/평가/모범답안 업데이트", () => {
    saveProvocation(baseProv);
    updateProvocation("p1", {
      answer: "내 답변",
      confidence: "high",
      answeredAt: new Date().toISOString(),
      evaluation: {
        verdict: "partial",
        whatWasRight: ["일부"],
        missingPoints: ["빠진점"],
        followUpQuestion: "후속?",
        retryAnswer: null,
        retryVerdict: null,
        retryEvaluatedAt: null,
      },
      modelAnswer: "모범 답안",
    });
    const updated = getProvocations("b1")[0];
    expect(updated.answer).toBe("내 답변");
    expect(updated.evaluation?.verdict).toBe("partial");
    expect(updated.modelAnswer).toBe("모범 답안");
  });
});

describe("store — ReviewItems", () => {
  it("saveReviewItem → getReviewItems(bookId) 필터링", () => {
    const item: ReviewItem = {
      id: "r1",
      bookId: "b1",
      conceptLabel: "개념",
      sourceProvocationId: "p1",
      status: "weak",
      reviewPrompt: "다시 생각해봐",
      createdAt: new Date().toISOString(),
    };
    saveReviewItem(item);
    saveReviewItem({ ...item, id: "r2", bookId: "b2" });
    expect(getReviewItems("b1")).toHaveLength(1);
  });
});

describe("store — Settings", () => {
  const baseSettings: Settings = {
    provider: "anthropic",
    apiKey: "sk-test",
    rememberKey: false,
    model: "claude-sonnet-4-6",
    defaultMode: "understand",
    obsidianFrontmatter: false,
  };

  it("rememberKey=false → sessionStorage에 apiKey", () => {
    saveSettings(baseSettings);
    expect(sessionStorage.getItem("rp:apiKey")).toBe("sk-test");
    expect(localStorage.getItem("rp:apiKey")).toBeNull();
  });

  it("rememberKey=true → localStorage에 apiKey", () => {
    saveSettings({ ...baseSettings, rememberKey: true });
    expect(localStorage.getItem("rp:apiKey")).toBe("sk-test");
  });

  it("getSettings: sessionStorage 우선, localStorage fallback", () => {
    saveSettings(baseSettings);
    const loaded = getSettings();
    expect(loaded.apiKey).toBe("sk-test");

    // sessionStorage cleared, fallback to localStorage
    sessionStorage.clear();
    localStorage.setItem("rp:apiKey", "sk-local");
    localStorage.setItem(
      "rp:settings",
      JSON.stringify({ ...baseSettings, rememberKey: true, apiKey: "sk-local" })
    );
    const fallback = getSettings();
    expect(fallback.apiKey).toBe("sk-local");
  });
});

describe("store — Session", () => {
  const session: SessionContext = {
    bookId: "b1",
    mode: "understand",
    startedAt: new Date().toISOString(),
    endedAt: null,
    firstPage: 1,
    lastPage: 1,
  };

  it("saveSession → getSession(bookId)", () => {
    saveSession(session);
    const loaded = getSession("b1");
    expect(loaded).not.toBeNull();
    expect(loaded!.mode).toBe("understand");
  });

  it("updateSession: endedAt + lastPage 업데이트", () => {
    saveSession(session);
    const endTime = new Date().toISOString();
    updateSession("b1", { endedAt: endTime, lastPage: 47 });
    const updated = getSession("b1");
    expect(updated!.endedAt).toBe(endTime);
    expect(updated!.lastPage).toBe(47);
  });
});
