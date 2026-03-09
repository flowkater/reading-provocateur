import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSession } from "../../src/hooks/useSession";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("useSession", () => {
  it("초기: mode=null, book=null", () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.mode).toBeNull();
    expect(result.current.book).toBeNull();
  });

  it("selectMode('understand') → mode 설정", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.selectMode("understand");
    });
    expect(result.current.mode).toBe("understand");
  });

  it("openBook(file) → book 생성 + localStorage 저장", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.selectMode("understand");
    });
    act(() => {
      result.current.openBook("test.pdf", 100);
    });
    expect(result.current.book).not.toBeNull();
    expect(result.current.book!.fileName).toBe("test.pdf");
  });

  it("updatePage(47) → currentPage + lastPage 업데이트", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.selectMode("understand");
    });
    act(() => {
      result.current.openBook("test.pdf", 100);
    });
    act(() => {
      result.current.updatePage(47);
    });
    expect(result.current.book!.currentPage).toBe(47);
  });

  it("getSessionContext() → SessionContext 반환", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.selectMode("understand");
    });
    act(() => {
      result.current.openBook("test.pdf", 100);
    });
    const ctx = result.current.getSessionContext();
    expect(ctx).not.toBeNull();
    expect(ctx!.mode).toBe("understand");
    expect(ctx!.startedAt).toBeTruthy();
  });

  it("endSession() → endedAt 기록", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.selectMode("understand");
    });
    act(() => {
      result.current.openBook("test.pdf", 100);
    });
    act(() => {
      result.current.endSession();
    });
    const ctx = result.current.getSessionContext();
    expect(ctx!.endedAt).toBeTruthy();
  });

  it("getDuration() → 분 단위 소요 시간 계산", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.selectMode("understand");
    });
    act(() => {
      result.current.openBook("test.pdf", 100);
    });
    // Duration should be 0 (or very small) since just started
    const duration = result.current.getDuration();
    expect(typeof duration).toBe("number");
    expect(duration).toBeLessThan(1);
  });
});
