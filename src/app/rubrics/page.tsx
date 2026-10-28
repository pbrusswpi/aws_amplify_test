"use client";
import Link from "next/link";
import { useDB, useReady } from "@/control/store";
import { fmtDate, maxScore } from "@/entities/types";
import { StatusBadge } from "@/boundary/hooks";

export default function PublishedRubrics() {
  const db = useDB(); const ready = useReady();
  if (!ready) return <p>Loading…</p>;
  const list = db.rubrics.filter((r) => r.status !== "draft");
  return (
    <div className="stack">
      <h1>Published rubrics</h1>
      {list.length === 0 ? <p className="muted">No rubrics are published yet. Designers can publish one from the Designer page.</p> : (
        <table>
          <thead><tr><th>Name</th><th>Status</th><th>Max score</th><th>Published</th></tr></thead>
          <tbody>{list.map((r) => (
            <tr key={r.id}><td><Link href={`/rubrics/${r.id}`}>{r.name}</Link></td><td><StatusBadge status={r.status} /></td><td>{maxScore(r)}</td><td>{fmtDate(r.publishedAt)}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}
