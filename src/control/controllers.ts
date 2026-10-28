"use client";
// EBC: Control – every use case from the case study is one function here.
// Business rules live here so the UI (boundary) stays thin.
import { update, type DB } from "./store";
import { blankExplanations, maxScore, orderedQuestions, type Question, type Rating, type Rubric, type Section } from "@/entities/types";

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
function must<T>(x: T | undefined, msg: string): T { if (x === undefined) throw new Error(msg); return x; }
const need = (v: string, label: string) => { if (!v.trim()) throw new Error(`${label} is required`); return v.trim(); };

function patchDraft(db: DB, id: string, fn: (r: Rubric) => Rubric): DB {
  const r = must(db.rubrics.find((x) => x.id === id), "Rubric not found");
  if (r.status !== "draft") throw new Error("Published rubrics can no longer be edited");
  return { ...db, rubrics: db.rubrics.map((x) => (x.id === id ? fn(r) : x)) };
}

export interface QuestionInput { text: string; explanations: Record<Rating, string> }

// ── Rubric Designer ──────────────────────────────────────────────
export const designer = {
  create(name: string): string {
    const id = uid();
    const n = need(name, "Rubric name");
    update((db) => ({ ...db, rubrics: [...db.rubrics, { id, name: n, questions: [], lowThreshold: 40, highThreshold: 55, status: "draft" }] }));
    return id;
  },
  remove(id: string) {
    update((db) => {
      const r = must(db.rubrics.find((x) => x.id === id), "Rubric not found");
      if (r.status !== "draft") throw new Error("Once published, a rubric cannot be deleted");
      return { ...db, rubrics: db.rubrics.filter((x) => x.id !== id) };
    });
  },
  edit(id: string, p: { name: string; lowThreshold: number; highThreshold: number }) {
    update((db) => patchDraft(db, id, (r) => {
      const name = need(p.name, "Rubric name");
      if (!(p.lowThreshold >= 0) || !(p.highThreshold >= 0)) throw new Error("Thresholds must be numbers");
      if (p.lowThreshold > p.highThreshold) throw new Error("The low threshold cannot be above the high threshold");
      return { ...r, name, lowThreshold: p.lowThreshold, highThreshold: p.highThreshold };
    }));
  },
  addQuestion(id: string, section: Section, input: QuestionInput) {
    const text = need(input.text, "Question text");
    update((db) => patchDraft(db, id, (r) => ({ ...r, questions: [...r.questions, { id: uid(), section, text, explanations: input.explanations }] })));
  },
  editQuestion(id: string, qid: string, input: QuestionInput) {
    const text = need(input.text, "Question text");
    update((db) => patchDraft(db, id, (r) => ({
      ...r, questions: r.questions.map((q): Question => (q.id === qid ? { ...q, text, explanations: input.explanations } : q)),
    })));
  },
  deleteQuestion(id: string, qid: string) {
    update((db) => patchDraft(db, id, (r) => ({ ...r, questions: r.questions.filter((q) => q.id !== qid) })));
  },
  publish(id: string) {
    update((db) => patchDraft(db, id, (r) => {
      if (r.questions.length === 0) throw new Error("Add at least one question before publishing");
      if (r.highThreshold > maxScore(r)) throw new Error(`The high threshold exceeds the maximum score (${maxScore(r)})`);
      if (r.questions.some((q) => Object.values(q.explanations).some((e) => !e.trim()))) throw new Error("Every question needs an explanation for each rating from 5 to 1");
      return { ...r, status: "published", publishedAt: now() };
    }));
  },
  deprecate(id: string, replacedBy: string) {
    update((db) => {
      const r = must(db.rubrics.find((x) => x.id === id), "Rubric not found");
      if (r.status !== "published") throw new Error("Only published rubrics can be deprecated");
      if (!db.rubrics.some((x) => x.id === replacedBy && x.id !== id && x.status === "published")) throw new Error("Choose a different published rubric as the replacement");
      return { ...db, rubrics: db.rubrics.map((x) => (x.id === id ? { ...x, status: "deprecated", deprecatedAt: now(), replacedBy } : x)) };
    });
  },
  duplicate(id: string): string {
    const copyId = uid();
    update((db) => {
      const r = must(db.rubrics.find((x) => x.id === id), "Rubric not found");
      const copy: Rubric = { ...r, id: copyId, name: `${r.name} (copy)`, status: "draft", publishedAt: undefined, deprecatedAt: undefined, replacedBy: undefined,
        questions: r.questions.map((q) => ({ ...q, id: uid(), explanations: { ...q.explanations } })) };
      return { ...db, rubrics: [...db.rubrics, copy] };
    });
    return copyId;
  },
  blank: blankExplanations,
};

// ── Journal Editor ───────────────────────────────────────────────
const paperHasReviewers = (db: DB, paperId: string) => db.assignments.some((a) => a.paperId === paperId);

export const editor = {
  registerJournal(name: string): string {
    const id = uid(); const n = need(name, "Journal name");
    update((db) => ({ ...db, journals: [...db.journals, { id, name: n, status: "active", adoptedRubricIds: [] }] }));
    return id;
  },
  withdrawJournal(id: string) {
    update((db) => ({ ...db, journals: db.journals.map((j) => (j.id === id ? { ...j, status: "withdrawn" } : j)) }));
  },
  adoptRubric(journalId: string, rubricId: string) {
    update((db) => {
      if (!db.rubrics.some((r) => r.id === rubricId && r.status === "published")) throw new Error("Only published rubrics can be adopted");
      return { ...db, journals: db.journals.map((j) => (j.id === journalId && !j.adoptedRubricIds.includes(rubricId) ? { ...j, adoptedRubricIds: [...j.adoptedRubricIds, rubricId] } : j)) };
    });
  },
  createIssue(journalId: string, volume: number, number: number) {
    if (!Number.isInteger(volume) || volume < 1 || !Number.isInteger(number) || number < 1 || number > 12) throw new Error("Volume must be 1 or more and Number must be between 1 and 12");
    update((db) => {
      if (db.issues.some((i) => i.journalId === journalId && i.volume === volume && i.number === number)) throw new Error("That issue already exists");
      return { ...db, issues: [...db.issues, { id: uid(), journalId, volume, number }] };
    });
  },
  deleteIssue(issueId: string) {
    update((db) => {
      const paperIds = db.papers.filter((p) => p.issueId === issueId).map((p) => p.id);
      if (paperIds.some((id) => paperHasReviewers(db, id))) throw new Error("Cannot delete an issue once reviewers are assigned to its papers");
      return { ...db, issues: db.issues.filter((i) => i.id !== issueId), papers: db.papers.filter((p) => p.issueId !== issueId) };
    });
  },
  addPaper(issueId: string, title: string, authors: string, rubricId: string) {
    const t = need(title, "Paper title"); const a = need(authors, "Authors");
    if (!rubricId) throw new Error("Choose a rubric for this paper");
    update((db) => ({ ...db, papers: [...db.papers, { id: uid(), issueId, title: t, authors: a, rubricId }] }));
  },
  withdrawPaper(paperId: string) {
    update((db) => {
      if (paperHasReviewers(db, paperId)) throw new Error("Cannot withdraw a paper once reviewers are assigned");
      return { ...db, papers: db.papers.filter((p) => p.id !== paperId) };
    });
  },
  assignReviewer(paperId: string, email: string, deadline: string) {
    const e = need(email, "Reviewer email").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error("Enter a valid email address");
    if (!deadline) throw new Error("Set a review deadline");
    update((db) => {
      if (db.assignments.some((a) => a.paperId === paperId && a.email === e)) throw new Error("That reviewer is already assigned to this paper");
      return { ...db, assignments: [...db.assignments, { id: uid(), paperId, email: e, deadline, status: "assigned", answers: {} }] };
    });
  },
  unassignReviewer(assignmentId: string) {
    update((db) => {
      const a = must(db.assignments.find((x) => x.id === assignmentId), "Assignment not found");
      if (a.status === "completed") throw new Error("A completed review cannot be unassigned");
      return { ...db, assignments: db.assignments.filter((x) => x.id !== assignmentId) };
    });
  },
  /** Generate RubricURL: unique token + six-digit PIN. */
  generateAccess(assignmentId: string) {
    update((db) => {
      const a = must(db.assignments.find((x) => x.id === assignmentId), "Assignment not found");
      if (a.status === "completed") throw new Error("This review is already complete");
      const pin = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
      return { ...db, assignments: db.assignments.map((x) => (x.id === assignmentId ? { ...x, token: uid(), pin } : x)) };
    });
  },
  /** Close Paper: removes the paper, its reviews and rubric copies from the issue. */
  closePaper(paperId: string) {
    update((db) => {
      const mine = db.assignments.filter((a) => a.paperId === paperId);
      if (mine.length === 0 || mine.some((a) => a.status !== "completed")) throw new Error("All assigned reviews must be completed before closing a paper");
      return { ...db, papers: db.papers.filter((p) => p.id !== paperId), assignments: db.assignments.filter((a) => a.paperId !== paperId) };
    });
  },
};

// ── Reviewer ─────────────────────────────────────────────────────
export const reviewer = {
  updateAnswer(assignmentId: string, questionId: string, rating: Rating, text: string) {
    const t = need(text, "An explanation");
    update((db) => {
      const a = must(db.assignments.find((x) => x.id === assignmentId), "Assignment not found");
      if (a.status === "completed") throw new Error("This review is complete and can no longer be changed");
      return { ...db, assignments: db.assignments.map((x) => (x.id === assignmentId ? { ...x, status: "in_progress", answers: { ...x.answers, [questionId]: { rating, text: t } } } : x)) };
    });
  },
  complete(assignmentId: string) {
    update((db) => {
      const a = must(db.assignments.find((x) => x.id === assignmentId), "Assignment not found");
      const paper = must(db.papers.find((p) => p.id === a.paperId), "Paper not found");
      const rubric = must(db.rubrics.find((r) => r.id === paper.rubricId), "Rubric not found");
      if (orderedQuestions(rubric).some((q) => !a.answers[q.id])) throw new Error("Answer every question before completing the review");
      return { ...db, assignments: db.assignments.map((x) => (x.id === assignmentId ? { ...x, status: "completed", completedAt: now() } : x)) };
    });
  },
};
