"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useDB, useReady } from "@/control/store";
import { ReviewWorkspace } from "@/boundary/ReviewWorkspace";

// Access Rubric: unique URL + six-digit PIN. Replace the client-side PIN check with a server check when a backend exists.
export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const db = useDB(); const ready = useReady();
  const [pin, setPin] = useState(""); const [unlocked, setUnlocked] = useState(false); const [wrong, setWrong] = useState(false);
  if (!ready) return <p>Loading…</p>;
  const assignment = db.assignments.find((a) => a.token === token);
  if (!assignment) return <p>This review link is not valid. Ask the journal editor for a new link.</p>;
  if (!unlocked) {
    return (
      <form className="panel stack" style={{ maxWidth: "24rem" }} onSubmit={(e) => { e.preventDefault(); if (pin === assignment.pin) setUnlocked(true); else setWrong(true); }}>
        <h1>Enter your PIN</h1>
        <label>Six-digit PIN from your email<input inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setWrong(false); }} /></label>
        {wrong && <p className="error" role="alert">That PIN does not match. Check your email and try again.</p>}
        <button className="primary" type="submit" disabled={pin.length !== 6}>Open review</button>
      </form>
    );
  }
  const paper = db.papers.find((p) => p.id === assignment.paperId);
  const rubric = db.rubrics.find((r) => r.id === paper?.rubricId);
  const issue = db.issues.find((i) => i.id === paper?.issueId);
  const journal = db.journals.find((j) => j.id === issue?.journalId);
  if (!paper || !rubric || !issue || !journal) return <p>This paper is no longer under review.</p>;
  return <ReviewWorkspace assignment={assignment} rubric={rubric} paper={paper} journalName={journal.name} volume={issue.volume} number={issue.number} />;
}
