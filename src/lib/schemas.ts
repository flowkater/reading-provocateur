import { z } from "zod";

export const PROVOCATION_KINDS = [
  "recall",
  "compression",
  "misconception",
  "challenge",
  "transfer",
] as const;

export const ProvocationPayloadSchema = z.object({
  kind: z.enum(PROVOCATION_KINDS),
  question: z.string(),
});

export type ProvocationPayload = z.infer<typeof ProvocationPayloadSchema>;

const PROVOCATION_KIND_ALIAS_MAP: Record<string, ProvocationPayload["kind"]> = {
  recall: "recall",
  recallquestion: "recall",
  memory: "recall",
  memorize: "recall",
  quiz: "recall",
  review: "recall",
  explanation: "recall",
  explain: "recall",
  회상: "recall",
  압축: "compression",
  compression: "compression",
  summary: "compression",
  summarize: "compression",
  summarization: "compression",
  synthesis: "compression",
  synthesize: "compression",
  요약: "compression",
  misconception: "misconception",
  misconceptioncheck: "misconception",
  confusion: "misconception",
  confused: "misconception",
  misunderstanding: "misconception",
  trap: "misconception",
  오개념: "misconception",
  혼동: "misconception",
  challenge: "challenge",
  critique: "challenge",
  critical: "challenge",
  counterexample: "challenge",
  objection: "challenge",
  반박: "challenge",
  비판: "challenge",
  도전: "challenge",
  transfer: "transfer",
  transferquestion: "transfer",
  application: "transfer",
  apply: "transfer",
  scenario: "transfer",
  example: "transfer",
  적용: "transfer",
  전이: "transfer",
};

function normalizeProvocationKind(kind: string): ProvocationPayload["kind"] | null {
  const normalized = kind.trim().toLowerCase().replace(/[\s_-]+/g, "");
  return PROVOCATION_KIND_ALIAS_MAP[normalized] ?? null;
}

export function parseProvocationPayload(raw: unknown): ProvocationPayload {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const candidate = raw as Record<string, unknown>;
    const normalizedKind =
      typeof candidate.kind === "string"
        ? normalizeProvocationKind(candidate.kind)
        : null;

    return ProvocationPayloadSchema.parse({
      ...candidate,
      ...(normalizedKind ? { kind: normalizedKind } : {}),
    });
  }

  return ProvocationPayloadSchema.parse(raw);
}

export const EvaluationPayloadSchema = z.object({
  verdict: z.enum(["correct", "partial", "incorrect", "memorized"]),
  whatWasRight: z.array(z.string()),
  missingPoints: z.array(z.string()),
  followUpQuestion: z.string().nullable(),
});

export type EvaluationPayload = z.infer<typeof EvaluationPayloadSchema>;
