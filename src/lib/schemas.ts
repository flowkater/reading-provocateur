import { z } from "zod";

export const ProvocationPayloadSchema = z.object({
  kind: z.enum(["recall", "compression", "misconception", "challenge", "transfer"]),
  question: z.string(),
});

export type ProvocationPayload = z.infer<typeof ProvocationPayloadSchema>;

export const EvaluationPayloadSchema = z.object({
  verdict: z.enum(["correct", "partial", "incorrect", "memorized"]),
  whatWasRight: z.array(z.string()),
  missingPoints: z.array(z.string()),
  followUpQuestion: z.string().nullable(),
});

export type EvaluationPayload = z.infer<typeof EvaluationPayloadSchema>;
