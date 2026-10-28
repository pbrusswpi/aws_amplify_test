"use client";
import { useState } from "react";
import { RATINGS, RATING_LABELS, classify, fmtDate, maxScore, orderedQuestions, type Assignment, type Paper, type Question, type Rating, type Rubric } from "@/entities/types";
import { reviewer } from "@/control/controllers";
import { buildReviewText } from "@/control/format";
import { ErrorBanner, StatusBadge, useRun } from "./hooks";

interface Props { assignment: Assignment; rubric: Rubric; paper: Paper; journalName: string; volume: number; number: number }

function AnswerForm({ q, initial, onSave, onCancel }: { q: Question; initial?: { rating: Rating; text: string }; onSave: (r: Rating, t: string) => void; onCancel: () => void }) {
  const [rating, setRating] = useState<Rating | null>(initial?.rating ?? null);
  const [text, setText] = useState(initial?.text ?? "");
  const { error, run } = useRun();
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); run(() => { if (!rating) throw new Error("Choose a rating from 1 to 5"); onSave(rating, text); }); }}>
      <fieldset>
        <legend>Rating</legend>
        {RATINGS.map((r) => (
          <label key={r} className="radio">
            <input type="radio" name={`r-${q.id}`} checked={rating === r} onChange={() => setRating(r)} />
            <span><strong>{r} – {RATING_LABELS[r]}.</strong> {q.explanations[r]}</span>
          </label>
        ))}
      </fieldset>
      <label>Your explanation<textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <ErrorBanner error={error} />
      <div className="row"><button className="primary" type="submit">Save answer</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

export function ReviewWorkspace(p: Props) {
  const { assignment, rubric, paper } = p;
  const [editing, setEditing] = useState<string | null>(null); // only one question at a time
  const [copied, setCopied] = useState(false);
  const { error, run } = useRun();
  const qs = orderedQuestions(rubric);
  const done = assignment.status === "completed";
  const answered = qs.filter((q) => assignment.answers[q.id]).length;
  const total = qs.reduce((s, q) => s + (assignment.answers[q.id]?.rating ?? 0), 0);
  const text = buildReviewText({ ...p });

  return (
    <div className="stack">
      <header className="stack">
        <h1>{paper.title}</h1>
        <p className="muted">{paper.authors} · {p.journalName}, Vol. {p.volume} No. {p.number}</p>
        <p>Rubric: <strong>{rubric.name}</strong> <StatusBadge status={assignment.status} /> Deadline {fmtDate(assignment.deadline)}</p>
        <p>{answered} of {qs.length} questions answered. Score so far: {total} / {maxScore(rubric)} ({classify(total, rubric)} quality)</p>
      </header>

      {qs.map((q, i) => {
        const a = assignment.answers[q.id];
        const isEditing = editing === q.id;
        return (
          <div className="panel stack" key={q.id}>
            <h3>{i + 1}. {q.text} <span className="muted">({q.section})</span></h3>
            {isEditing ? (
              <AnswerForm q={q} initial={a} onCancel={() => setEditing(null)}
                onSave={(r, t) => { reviewer.updateAnswer(assignment.id, q.id, r, t); setEditing(null); }} />
            ) : (
              <>
                {a ? <p><strong>{a.rating} – {RATING_LABELS[a.rating]}.</strong> {a.text}</p> : <p className="muted">Not answered yet.</p>}
                {!done && <div><button disabled={editing !== null} onClick={() => setEditing(q.id)}>{a ? "Update answer" : "Answer"}</button></div>}
              </>
            )}
          </div>
        );
      })}

      <ErrorBanner error={error} />
      {!done && (
        <div className="row">
          <button className="primary" disabled={editing !== null || answered < qs.length}
            onClick={() => run(() => { if (window.confirm("Complete this review? You will not be able to change it afterwards.")) reviewer.complete(assignment.id); })}>
            Complete review
          </button>
          {answered < qs.length && <span className="muted">Answer every question to complete.</span>}
        </div>
      )}
      {done && (
        <section className="stack">
          <h2>Your review</h2>
          <p>Copy this text into your journal's review system. The review is complete and read-only.</p>
          <pre className="ascii">{text}</pre>
          <div><button className="primary" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); }}>{copied ? "Copied" : "Copy to clipboard"}</button></div>
        </section>
      )}
    </div>
  );
}
