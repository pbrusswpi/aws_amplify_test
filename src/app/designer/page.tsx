"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDB, useReady } from "@/control/store";
import { designer } from "@/control/controllers";
import { maxScore } from "@/entities/types";
import { ErrorBanner, StatusBadge, useRun } from "@/boundary/hooks";

export default function DesignerHome() {
  const db = useDB(); const ready = useReady(); const router = useRouter();
  const { error, run } = useRun();
  const [name, setName] = useState("");
  if (!ready) return <p>Loading…</p>;
  return (
    <div className="stack">
      <h1>Your rubrics</h1>
      <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => { router.push(`/designer/${designer.create(name)}`); }); }}>
        <input placeholder="New rubric name" aria-label="New rubric name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="primary" type="submit">Create rubric</button>
      </form>
      <ErrorBanner error={error} />
      {db.rubrics.length === 0 ? <p className="muted">No rubrics yet. Name one above to start.</p> : (
        <table>
          <thead><tr><th>Name</th><th>Status</th><th>Questions</th><th>Max</th><th></th></tr></thead>
          <tbody>{db.rubrics.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/designer/${r.id}`}>{r.name}</Link></td><td><StatusBadge status={r.status} /></td>
              <td>{r.questions.length}</td><td>{maxScore(r)}</td>
              <td className="row">
                <button onClick={() => run(() => router.push(`/designer/${designer.duplicate(r.id)}`))}>Duplicate</button>
                {r.status === "draft" && <button onClick={() => run(() => { if (window.confirm(`Delete "${r.name}"?`)) designer.remove(r.id); })}>Delete</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}
