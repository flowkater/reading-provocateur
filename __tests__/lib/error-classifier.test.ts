import { describe, it, expect } from "vitest";
import { classifyError } from "../../src/lib/error-classifier";
import { APIError, RateLimitError, AuthenticationError } from "@anthropic-ai/sdk";

const headers = new Headers();

describe("classifyError", () => {
  it("AuthenticationError → 'API Key를 확인해주세요'", () => {
    const err = new AuthenticationError(401, { message: "invalid api key" }, "invalid api key", headers);
    const result = classifyError(err);
    expect(result.type).toBe("auth");
    expect(result.message).toBe("API Key를 확인해주세요.");
  });

  it("RateLimitError → '요청이 너무 많아요...'", () => {
    const err = new RateLimitError(429, { message: "rate limit" }, "rate limit", headers);
    const result = classifyError(err);
    expect(result.type).toBe("rate-limit");
    expect(result.message).toBe("요청이 너무 많아요. 잠시 후 다시 시도해주세요.");
  });

  it("TypeError (fetch) → '인터넷 연결을 확인해주세요'", () => {
    const err = new TypeError("Failed to fetch");
    const result = classifyError(err);
    expect(result.type).toBe("network");
    expect(result.message).toBe("인터넷 연결을 확인해주세요.");
  });

  it("APIError → 'API 오류: ...'", () => {
    const err = new APIError(500, { message: "server error" }, "server error", headers);
    const result = classifyError(err);
    expect(result.type).toBe("api");
    expect(result.message).toContain("API 오류:");
  });

  it("일반 Error → err.message", () => {
    const err = new Error("something went wrong");
    const result = classifyError(err);
    expect(result.type).toBe("unknown");
    expect(result.message).toBe("something went wrong");
  });

  it("non-Error → '도발 생성에 실패했습니다'", () => {
    const result = classifyError("string error");
    expect(result.type).toBe("unknown");
    expect(result.message).toBe("도발 생성에 실패했습니다.");
  });

  it("SDK AuthenticationError 실제 인스턴스 instanceof 확인", () => {
    const err = new AuthenticationError(401, { message: "bad key" }, "bad key", headers);
    expect(err instanceof AuthenticationError).toBe(true);
    expect(err instanceof APIError).toBe(true);
    const result = classifyError(err);
    expect(result.type).toBe("auth");
  });

  it("SDK RateLimitError 실제 인스턴스 instanceof 확인", () => {
    const err = new RateLimitError(429, { message: "too many" }, "too many", headers);
    expect(err instanceof RateLimitError).toBe(true);
    expect(err instanceof APIError).toBe(true);
    const result = classifyError(err);
    expect(result.type).toBe("rate-limit");
  });
});
