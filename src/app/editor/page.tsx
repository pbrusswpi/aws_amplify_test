"use client";
import Link from "next/link";
import { useState } from "react";
import { useDB, useReady } from "@/control/store";
import { editor } from "@/control/controllers";
import { ErrorBanner, StatusBadge, useRun } from "@/boundary/hooks";

// No separate log-in screen: opening a journal dashboard is the authenticated entry point.
// Add real authentication in front of /editor when a backend is available.
export default function EditorHome() {
  const db = useDB(); const ready = useReady();
  const { error, run } = useRun();
  const [name, setName] = useState("");
  if (!ready) return <p>Loading…</p>;
  return (
    <div className="stack">
      <h1>Journals</h1>
      <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => { editor.registerJournal(name); setName(""); }); }}>
        <input placeholder="Journal name" aria-label="Journal name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="primary" type="submit">Register journal</button>
      </form>
      <ErrorBanner error={error} />
      {db.journals.length === 0 && <p className="muted">No journals registered. Register one above to open its dashboard.</p>}
      {db.journals.map((j) => (
        <div className="panel row between" key={j.id}>
          <span>{j.status === "active" ? <Link href={`/editor/${j.id}`}>{j.name}</Link> : j.name} <StatusBadge status={j.status} /></span>
          {j.status === "active" && <button onClick={() => run(() => { if (window.confirm(`Withdraw "${j.name}" from RASER?`)) editor.withdrawJournal(j.id); })}>Withdraw</button>}
        </div>
      ))}
    </div>
  );
}
