import type { Provocation, ReviewItem, SessionContext, Settings } from "../types";

export interface ExportInput {
  bookTitle: string;
  session: SessionContext;
  provocations: Provocation[];
  reviewItems: ReviewItem[];
  settings: Settings;
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return "진행 중";
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const minutes = Math.round(ms / 60000);
  return `${minutes}분`;
}

function verdictEmoji(verdict: string): string {
  switch (verdict) {
    case "correct": return "✅";
    case "partial": return "🟡";
    case "incorrect": return "❌";
    case "memorized": return "📦";
    default: return "";
  }
}

export function generateExportMarkdown(input: ExportInput): string {
  const { bookTitle, session, provocations, reviewItems, settings } = input;
  const date = session.startedAt.split("T")[0];
  const lines: string[] = [];

  // Obsidian frontmatter
  if (settings.obsidianFrontmatter) {
    lines.push("---");
    lines.push(`title: "Reading Provocateur — ${bookTitle}"`);
    lines.push(`date: ${date}`);
    lines.push(`mode: ${session.mode}`);
    lines.push("tags: [reading-provocateur, study]");
    lines.push("---");
    lines.push("");
  }

  // Title
  lines.push(`# 📖 ${bookTitle} — Reading Provocateur`);
  lines.push(`**모드:** ${session.mode} | **날짜:** ${date}`);
  lines.push("");

  // Layer 1: Provocation cards
  lines.push("## 도발 기록");
  lines.push("");

  for (const prov of provocations) {
    lines.push(`### p.${prov.pageNumber} · ${prov.kind} · ${prov.intent ?? "page-based"}`);
    lines.push(`**Q:** ${prov.question}`);
    lines.push(`**A:** ${prov.answer ?? "(미답변)"}`);
    lines.push(`**확신도:** ${prov.confidence ?? "-"}`);

    if (prov.evaluation) {
      const ev = prov.evaluation;
      lines.push(`**판정:** ${verdictEmoji(ev.verdict)} ${ev.verdict}`);
      if (ev.whatWasRight.length > 0) {
        lines.push(`**맞은 점:** ${ev.whatWasRight.join(", ")}`);
      }
      if (ev.missingPoints.length > 0) {
        lines.push(`**빠진 점:** ${ev.missingPoints.join(", ")}`);
      }
      if (ev.retryAnswer) {
        lines.push(`**재답변:** ${ev.retryAnswer}`);
        lines.push(`**재판정:** ${ev.retryVerdict ? `${verdictEmoji(ev.retryVerdict)} ${ev.retryVerdict}` : "-"}`);
      }
    }

    if (prov.modelAnswer) {
      lines.push(`**모범 답안:** ${prov.modelAnswer}`);
    }

    lines.push("");
  }

  // Layer 2: User answers only
  lines.push("## 내 답변 노트");
  lines.push("");
  for (const prov of provocations) {
    if (prov.answer) {
      lines.push(`- (p.${prov.pageNumber}) ${prov.answer}`);
    }
    if (prov.evaluation?.retryAnswer) {
      lines.push(`- (p.${prov.pageNumber}, 재시도) ${prov.evaluation.retryAnswer}`);
    }
  }
  lines.push("");

  // Layer 3: Weak concepts
  if (reviewItems.length > 0) {
    lines.push("## 약점 목록");
    lines.push("");
    for (const item of reviewItems) {
      lines.push(`- **${item.conceptLabel}** (${item.status}) — ${item.reviewPrompt}`);
    }
    lines.push("");

    // Review questions (max 5)
    lines.push("## 리뷰 질문");
    lines.push("");
    for (const item of reviewItems.slice(0, 5)) {
      lines.push(`- ${item.reviewPrompt}`);
    }
    lines.push("");
  }

  // Statistics
  lines.push("## 세션 통계");
  lines.push("");
  lines.push(`- 도발 수: ${provocations.length}`);

  // Verdict distribution
  const verdictCounts: Record<string, number> = {};
  const confidenceCounts: Record<string, number> = {};
  let highConfidenceWrong = 0;

  for (const prov of provocations) {
    if (prov.evaluation) {
      const v = prov.evaluation.verdict;
      verdictCounts[v] = (verdictCounts[v] || 0) + 1;
      if (prov.confidence === "high" && (v === "incorrect" || v === "memorized")) {
        highConfidenceWrong++;
      }
    }
    if (prov.confidence) {
      confidenceCounts[prov.confidence] = (confidenceCounts[prov.confidence] || 0) + 1;
    }
  }

  const verdictStr = Object.entries(verdictCounts)
    .map(([k, v]) => `${verdictEmoji(k)} ${k}: ${v}`)
    .join(", ");
  lines.push(`- 판정 분포: ${verdictStr}`);

  const confStr = Object.entries(confidenceCounts)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  lines.push(`- 확신도 분포: ${confStr}`);
  lines.push(`- ⚡ 높은확신+틀림: ${highConfidenceWrong}건`);
  lines.push(`- 읽은 범위: p.${session.firstPage}~${session.lastPage}`);
  lines.push(`- 소요 시간: ~${formatDuration(session.startedAt, session.endedAt)}`);
  lines.push("");

  return lines.join("\n");
}
