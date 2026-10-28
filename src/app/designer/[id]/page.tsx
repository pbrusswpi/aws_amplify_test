"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useDB, useReady } from "@/control/store";
import { designer } from "@/control/controllers";
import { SECTIONS, maxScore, type Rubric, type Section } from "@/entities/types";
import { ErrorBanner, StatusBadge, useRun } from "@/boundary/hooks";
import { QuestionForm } from "@/boundary/QuestionForm";
import { RubricView } from "@/boundary/RubricView";

function Settings({ rubric }: { rubric: Rubric }) {
  const [name, setName] = useState(rubric.name);
  const [low, setLow] = useState(rubric.lowThreshold);
  const [high, setHigh] = useState(rubric.highThreshold);
  const { error, run } = useRun();
  return (
    <form className="panel stack" onSubmit={(e) => { e.preventDefault(); run(() => designer.edit(rubric.id, { name, lowThreshold: low, highThreshold: high })); }}>
      <label>Rubric name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <div className="row">
        <label>Low quality below<input type="number" min={0} value={low} onChange={(e) => setLow(Number(e.target.value))} /></label>
        <label>High quality from<input type="number" min={0} value={high} onChange={(e) => setHigh(Number(e.target.value))} /></label>
      </div>
      <p className="muted">Maximum score is {maxScore(rubric)} (5 × {rubric.questions.length} questions). Scores from the low to just under the high threshold are moderate.</p>
      <ErrorBanner error={error} />
      <div><button type="submit">Save settings</button></div>
    </form>
  );
}

export default function DesignRubric() {
  const { id } = useParams<{ id: string }>();
  const db = useDB(); const ready = useReady(); const router = useRouter();
  const { error, run } = useRun();
  const [adding, setAdding] = useState<Section | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [replacement, setReplacement] = useState("");
  const rubric = db.rubrics.find((r) => r.id === id);
  if (!ready) return <p>Loading…</p>;
  if (!rubric) return <p>Rubric not found. <Link href="/designer">Back to your rubrics</Link></p>;

  if (rubric.status !== "draft") {
    const others = db.rubrics.filter((r) => r.status === "published" && r.id !== rubric.id);
    return (
      <div className="stack">
        <div className="row">
          <button onClick={() => run(() => router.push(`/designer/${designer.duplicate(rubric.id)}`))}>Duplicate as new draft</button>
          {rubric.status === "published" && (<>
            <select aria-label="Replacement rubric" value={replacement} onChange={(e) => setReplacement(e.target.value)}>
              <option value="">Replace with…</option>{others.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button onClick={() => run(() => designer.deprecate(rubric.id, replacement))}>Deprecate</button>
          </>)}
        </div>
        <ErrorBanner error={error} />
        <p className="muted">Published rubrics are read-only. Share the public link: <Link href={`/rubrics/${rubric.id}`}>/rubrics/{rubric.id}</Link></p>
        <RubricView rubric={rubric} replacement={db.rubrics.find((r) => r.id === rubric.replacedBy)} />
      </div>
    );
  }

  return (
    <div className="stack">
      <h1>{rubric.name} <StatusBadge status="draft" /></h1>
      <Settings key={rubric.id + rubric.lowThreshold + rubric.highThreshold + rubric.name} rubric={rubric} />
      {SECTIONS.map((s) => {
        const qs = rubric.questions.filter((q) => q.section === s);
        return (
          <section key={s} className="stack">
            <h2>{s}</h2>
            {qs.length === 0 && <p className="muted">No questions yet.</p>}
            {qs.map((q) => editing === q.id ? (
              <QuestionForm key={q.id} initial={q} onCancel={() => setEditing(null)} onSave={(v) => { designer.editQuestion(rubric.id, q.id, v); setEditing(null); }} />
            ) : (
              <div className="panel row between" key={q.id}>
                <span>{q.text}</span>
                <span className="row"><button onClick={() => { setEditing(q.id); setAdding(null); }}>Edit</button><button onClick={() => run(() => designer.deleteQuestion(rubric.id, q.id))}>Delete</button></span>
              </div>
            ))}
            {adding === s
              ? <QuestionForm onCancel={() => setAdding(null)} onSave={(v) => { designer.addQuestion(rubric.id, s, v); setAdding(null); }} />
              : <div><button onClick={() => { setAdding(s); setEditing(null); }}>Add question</button></div>}
          </section>
        );
      })}
      <ErrorBanner error={error} />
      <div className="row"><button className="primary" onClick={() => run(() => designer.publish(rubric.id))}>Publish rubric</button><span className="muted">Publishing records today as the publication date and locks the rubric.</span></div>
    </div>
  );
}
