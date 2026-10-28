"use client";
import { useState } from "react";
import { classify, fmtDate, maxScore, orderedQuestions, type Assignment, type Paper, type Rubric } from "@/entities/types";
import { editor } from "@/control/controllers";
import { buildReviewText } from "@/control/format";
import { ErrorBanner, StatusBadge, useRun } from "./hooks";

interface Props { paper: Paper; rubric?: Rubric; assignments: Assignment[]; journalName: string; volume: number; number: number }

export function PaperRow({ paper, rubric, assignments, journalName, volume, number }: Props) {
  const { error, run } = useRun();
  const [email, setEmail] = useState("");
  const [deadline, setDeadline] = useState("");
  const [reading, setReading] = useState<string | null>(null);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const allDone = assignments.length > 0 && assignments.every((a) => a.status === "completed");
  const subject = encodeURIComponent(`Review request: ${paper.title}`);

  return (
    <div className="panel stack">
      <div className="row between">
        <div><h4>{paper.title}</h4><p className="muted">{paper.authors} · Rubric: {rubric?.name ?? "missing"}</p></div>
        <div className="row">
          {assignments.length === 0 && <button onClick={() => run(() => editor.withdrawPaper(paper.id))}>Withdraw paper</button>}
          {allDone && <button className="primary" onClick={() => run(() => editor.closePaper(paper.id))}>Close paper</button>}
        </div>
      </div>

      {assignments.map((a) => {
        const link = a.token ? `${origin}/review/${a.token}` : "";
        return (
          <div className="assignment stack" key={a.id}>
            <div className="row between">
              <span>{a.email} <StatusBadge status={a.status} /> <span className="muted">due {fmtDate(a.deadline)}</span></span>
              <div className="row">
                {a.status !== "completed" && <button onClick={() => run(() => editor.generateAccess(a.id))}>{a.token ? "Regenerate link and PIN" : "Generate link and PIN"}</button>}
                {a.status !== "completed" && <button onClick={() => run(() => editor.unassignReviewer(a.id))}>Unassign</button>}
                {a.status === "completed" && <button onClick={() => setReading(reading === a.id ? null : a.id)}>{reading === a.id ? "Hide review" : "Read review"}</button>}
              </div>
            </div>
            {a.token && a.status !== "completed" && (
              <div className="access">
                <p>Link: <a href={link}>{link}</a></p>
                <p>PIN: <code>{a.pin}</code></p>
                <div className="row">
                  <a className="btn" href={`mailto:${a.email}?subject=${subject}&body=${encodeURIComponent(`Please complete your review here: ${link}`)}`}>Email link</a>
                  <a className="btn" href={`mailto:${a.email}?subject=${subject}&body=${encodeURIComponent(`Your PIN: ${a.pin}`)}`}>Email PIN</a>
                </div>
              </div>
            )}
            {reading === a.id && rubric && (
              <>
                <p>Score {orderedQuestions(rubric).reduce((s, q) => s + (a.answers[q.id]?.rating ?? 0), 0)} / {maxScore(rubric)} ({classify(orderedQuestions(rubric).reduce((s, q) => s + (a.answers[q.id]?.rating ?? 0), 0), rubric)} quality)</p>
                <pre className="ascii">{buildReviewText({ rubric, paper, assignment: a, journalName, volume, number })}</pre>
              </>
            )}
          </div>
        );
      })}

      <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => { editor.assignReviewer(paper.id, email, deadline); setEmail(""); }); }}>
        <input type="email" placeholder="Reviewer email" aria-label="Reviewer email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="date" aria-label="Review deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        <button type="submit">Assign reviewer</button>
      </form>
      <ErrorBanner error={error} />
    </div>
  );
}
