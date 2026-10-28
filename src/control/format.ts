import { RATING_LABELS, classify, maxScore, orderedQuestions, type Assignment, type Paper, type Rubric } from "@/entities/types";

export interface ReviewContext { rubric: Rubric; paper: Paper; assignment: Assignment; journalName: string; volume: number; number: number }

/** Formatted ASCII text the reviewer pastes into their existing review system. */
export function buildReviewText({ rubric, paper, assignment, journalName, volume, number }: ReviewContext): string {
  const qs = orderedQuestions(rubric);
  const total = qs.reduce((s, q) => s + (assignment.answers[q.id]?.rating ?? 0), 0);
  const rule = "=".repeat(72);
  const lines = [
    rule, "RASER REVIEW", rule,
    `Journal : ${journalName}, Vol. ${volume} No. ${number}`,
    `Paper   : ${paper.title}`,
    `Authors : ${paper.authors}`,
    `Rubric  : ${rubric.name}`,
    `Reviewer: ${assignment.email}`,
    `Score   : ${total} / ${maxScore(rubric)} (${classify(total, rubric)} quality)`,
    rule,
  ];
  let current = "";
  qs.forEach((q, i) => {
    if (q.section !== current) { current = q.section; lines.push("", `## ${q.section}`, "-".repeat(72)); }
    const a = assignment.answers[q.id];
    lines.push("", `Q${i + 1}. ${q.text}`, `    Rating: ${a ? `${a.rating} / 5 (${RATING_LABELS[a.rating]})` : "unanswered"}`, `    Answer: ${a?.text ?? ""}`);
  });
  lines.push("", rule);
  return lines.join("\n");
}
