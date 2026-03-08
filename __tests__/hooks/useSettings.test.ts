import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "../../src/hooks/useSettings";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("useSettings", () => {
  it("초기 로드: localStorage/sessionStorage에서 Settings 복원", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.provider).toBe("anthropic");
    expect(result.current.settings.apiKey).toBe("");
  });

  it("저장: rememberKey=false → apiKey sessionStorage", () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({
        ...result.current.settings,
        apiKey: "sk-test",
        rememberKey: false,
      });
    });
    expect(sessionStorage.getItem("rp:apiKey")).toBe("sk-test");
  });

  it("저장: rememberKey=true → apiKey localStorage", () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({
        ...result.current.settings,
        apiKey: "sk-test",
        rememberKey: true,
      });
    });
    expect(localStorage.getItem("rp:apiKey")).toBe("sk-test");
  });

  it("apiKey 빈값 → hasApiKey=false", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.hasApiKey).toBe(false);
  });

  it("모델 변경 → 즉시 반영", () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({
        ...result.current.settings,
        model: "claude-haiku-4-5",
      });
    });
    expect(result.current.settings.model).toBe("claude-haiku-4-5");
  });
});
