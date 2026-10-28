// EBC: Entities – pure domain model and rules, no UI or storage.
export const SECTIONS = [
  "Introduction",
  "Materials & Sourcing",
  "Methodology & Reproducibility",
  "Replication",
  "Risk of Bias & Statistics",
  "Reporting & Transparency",
] as const;
export type Section = (typeof SECTIONS)[number];

export type Rating = 1 | 2 | 3 | 4 | 5;
export const RATINGS: Rating[] = [5, 4, 3, 2, 1];
export const RATING_LABELS: Record<Rating, string> = {
  5: "Yes, fully met",
  4: "Mostly met, minor gap",
  3: "Partial",
  2: "Largely unmet",
  1: "No / not reported",
};

export interface Question {
  id: string;
  section: Section;
  text: string;
  explanations: Record<Rating, string>;
}
export type RubricStatus = "draft" | "published" | "deprecated";
export interface Rubric {
  id: string;
  name: string;
  questions: Question[];
  lowThreshold: number;
  highThreshold: number;
  status: RubricStatus;
  publishedAt?: string;
  deprecatedAt?: string;
  replacedBy?: string;
}
export interface Journal { id: string; name: string; status: "active" | "withdrawn"; adoptedRubricIds: string[] }
export interface Issue { id: string; journalId: string; volume: number; number: number }
export interface Paper {
  id: string; issueId: string; title: string; authors: string; rubricId: string;
}
export interface Answer { rating: Rating; text: string }
export interface Assignment {
  id: string; paperId: string; email: string; deadline: string;
  status: "assigned" | "in_progress" | "completed";
  token?: string; pin?: string;
  answers: Record<string, Answer>;
  completedAt?: string;
}

export const blankExplanations = (): Record<Rating, string> => ({ 5: "", 4: "", 3: "", 2: "", 1: "" });
export const maxScore = (r: Pick<Rubric, "questions">) => 5 * r.questions.length;
export type Quality = "High" | "Moderate" | "Low";
export function classify(score: number, r: Pick<Rubric, "lowThreshold" | "highThreshold">): Quality {
  if (score >= r.highThreshold) return "High";
  if (score < r.lowThreshold) return "Low";
  return "Moderate";
}
/** Questions in fixed section order, then insertion order. */
export function orderedQuestions(r: Pick<Rubric, "questions">): Question[] {
  return SECTIONS.flatMap((s) => r.questions.filter((q) => q.section === s));
}
export const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "—");
