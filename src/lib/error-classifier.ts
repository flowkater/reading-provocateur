import { APIError, RateLimitError, AuthenticationError } from "@anthropic-ai/sdk";

export function classifyError(err: unknown): { message: string; type: string } {
  if (err instanceof AuthenticationError)
    return { message: "API Key를 확인해주세요.", type: "auth" };
  if (err instanceof RateLimitError)
    return { message: "요청이 너무 많아요. 잠시 후 다시 시도해주세요.", type: "rate-limit" };
  if (err instanceof TypeError && err.message?.includes("fetch"))
    return { message: "인터넷 연결을 확인해주세요.", type: "network" };
  if (err instanceof APIError)
    return { message: `API 오류: ${err.message}`, type: "api" };
  if (err instanceof Error)
    return { message: err.message, type: "unknown" };
  return { message: "도발 생성에 실패했습니다.", type: "unknown" };
}
