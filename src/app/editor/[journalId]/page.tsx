"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useDB, useReady } from "@/control/store";
import { editor } from "@/control/controllers";
import { ErrorBanner, useRun } from "@/boundary/hooks";
import { PaperRow } from "@/boundary/PaperRow";
import type { Issue, Journal } from "@/entities/types";

function IssueCard({ journal, issue }: { journal: Journal; issue: Issue }) {
  const db = useDB(); const { error, run } = useRun();
  const [title, setTitle] = useState(""); const [authors, setAuthors] = useState(""); const [rubricId, setRubricId] = useState("");
  const papers = db.papers.filter((p) => p.issueId === issue.id);
  const usable = db.rubrics.filter((r) => journal.adoptedRubricIds.includes(r.id) && r.status === "published");
  return (
    <section className="stack">
      <div className="row between"><h3>Volume {issue.volume}, Number {issue.number}</h3><button onClick={() => run(() => editor.deleteIssue(issue.id))}>Delete issue</button></div>
      {papers.length === 0 && <p className="muted">No papers in this issue yet.</p>}
      {papers.map((p) => (
        <PaperRow key={p.id} paper={p} rubric={db.rubrics.find((r) => r.id === p.rubricId)} journalName={journal.name} volume={issue.volume} number={issue.number}
          assignments={db.assignments.filter((a) => a.paperId === p.id)} />
      ))}
      <form className="panel row" onSubmit={(e) => { e.preventDefault(); run(() => { editor.addPaper(issue.id, title, authors, rubricId); setTitle(""); setAuthors(""); }); }}>
        <input placeholder="Paper title" aria-label="Paper title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Authors" aria-label="Authors" value={authors} onChange={(e) => setAuthors(e.target.value)} />
        <select aria-label="Rubric" value={rubricId} onChange={(e) => setRubricId(e.target.value)}>
          <option value="">Rubric…</option>{usable.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button type="submit">Add paper</button>
      </form>
      <ErrorBanner error={error} />
    </section>
  );
}

export default function Dashboard() {
  const { journalId } = useParams<{ journalId: string }>();
  const db = useDB(); const ready = useReady(); const { error, run } = useRun();
  const [adopt, setAdopt] = useState(""); const [volume, setVolume] = useState(1); const [number, setNumber] = useState(1);
  const journal = db.journals.find((j) => j.id === journalId);
  if (!ready) return <p>Loading…</p>;
  if (!journal || journal.status !== "active") return <p>Journal not found or withdrawn. <Link href="/editor">Back to journals</Link></p>;
  const adopted = db.rubrics.filter((r) => journal.adoptedRubricIds.includes(r.id));
  const available = db.rubrics.filter((r) => r.status === "published" && !journal.adoptedRubricIds.includes(r.id));
  const issues = db.issues.filter((i) => i.journalId === journal.id);
  return (
    <div className="stack">
      <h1>{journal.name}</h1>
      <ErrorBanner error={error} />
      <section className="stack">
        <h2>Rubrics</h2>
        {adopted.length === 0 && <p className="muted">Adopt a published rubric to use it on papers.</p>}
        {adopted.map((r) => (
          <div className="panel" key={r.id}><Link href={`/rubrics/${r.id}`}>{r.name}</Link> {r.status === "deprecated" && <span className="notice">Deprecated: adopt its replacement</span>}</div>
        ))}
        <div className="row">
          <select aria-label="Rubric to adopt" value={adopt} onChange={(e) => setAdopt(e.target.value)}>
            <option value="">Adopt a published rubric…</option>{available.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button onClick={() => run(() => { editor.adoptRubric(journal.id, adopt); setAdopt(""); })}>Adopt rubric</button>
        </div>
      </section>
      <section className="stack">
        <h2>Issues</h2>
        <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => editor.createIssue(journal.id, volume, number)); }}>
          <label>Volume<input type="number" min={1} value={volume} onChange={(e) => setVolume(Number(e.target.value))} /></label>
          <label>Number (1–12)<input type="number" min={1} max={12} value={number} onChange={(e) => setNumber(Number(e.target.value))} /></label>
          <button className="primary" type="submit">Create issue</button>
        </form>
        {issues.length === 0 && <p className="muted">No issues yet. Create one to add papers for review.</p>}
        {issues.map((i) => <IssueCard key={i.id} journal={journal} issue={i} />)}
      </section>
    </div>
  );
}
