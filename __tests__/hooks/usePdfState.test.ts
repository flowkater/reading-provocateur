import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePdfState } from "../../src/hooks/usePdfState";

// Polyfill for jsdom
const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
const revokeObjectURLMock = vi.fn();

beforeEach(() => {
  URL.createObjectURL = createObjectURLMock;
  URL.revokeObjectURL = revokeObjectURLMock;
  createObjectURLMock.mockClear();
  revokeObjectURLMock.mockClear();
});

describe("usePdfState", () => {
  it("fileUrl 변경 시 이전 URL에 revokeObjectURL 호출", () => {
    createObjectURLMock
      .mockReturnValueOnce("blob:first-url")
      .mockReturnValueOnce("blob:second-url");

    const { result } = renderHook(() => usePdfState());

    // First file
    act(() => {
      result.current.handleFileSelect(
        new File(["a"], "a.pdf", { type: "application/pdf" })
      );
    });
    expect(result.current.fileUrl).toBe("blob:first-url");
    expect(revokeObjectURLMock).not.toHaveBeenCalled();

    // Second file — should revoke first URL
    act(() => {
      result.current.handleFileSelect(
        new File(["b"], "b.pdf", { type: "application/pdf" })
      );
    });
    expect(result.current.fileUrl).toBe("blob:second-url");
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:first-url");
  });

  it("unmount 시 현재 fileUrl에 revokeObjectURL 호출", () => {
    createObjectURLMock.mockReturnValue("blob:cleanup-url");

    const { result, unmount } = renderHook(() => usePdfState());

    act(() => {
      result.current.handleFileSelect(
        new File(["c"], "c.pdf", { type: "application/pdf" })
      );
    });

    unmount();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:cleanup-url");
  });
});
