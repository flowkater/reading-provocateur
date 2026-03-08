import { v4 as uuidv4 } from "uuid";
import type { Provocation, ReviewItem } from "../types";

export function buildReviewItem(provocation: Provocation): ReviewItem | null {
  const eval_ = provocation.evaluation;
  if (!eval_) return null;

  const { verdict } = eval_;
  const confidence = provocation.confidence;

  // correct + high/medium → no review item
  if (verdict === "correct" && confidence !== "low") {
    return null;
  }

  // correct + low → pending-review
  if (verdict === "correct" && confidence === "low") {
    return {
      id: uuidv4(),
      bookId: provocation.bookId,
      conceptLabel: eval_.missingPoints[0] ?? provocation.question,
      sourceProvocationId: provocation.id,
      status: "pending-review",
      reviewPrompt: `확신도가 낮았던 질문: ${provocation.question}`,
      createdAt: new Date().toISOString(),
    };
  }

  // partial/incorrect/memorized → weak
  const conceptLabel = eval_.missingPoints[0] ?? provocation.question;
  const missingStr = eval_.missingPoints.join(", ");

  return {
    id: uuidv4(),
    bookId: provocation.bookId,
    conceptLabel,
    sourceProvocationId: provocation.id,
    status: "weak",
    reviewPrompt: `빠진 점: ${missingStr}. ${eval_.followUpQuestion ?? "다시 생각해봐."}`,
    createdAt: new Date().toISOString(),
  };
}
