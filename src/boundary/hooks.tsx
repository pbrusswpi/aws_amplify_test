"use client";
import { useState } from "react";

/** Runs a controller call and turns thrown business-rule errors into a visible message. */
export function useRun() {
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => void) => {
    try { fn(); setError(null); } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };
  return { error, run };
}
export function ErrorBanner({ error }: { error: string | null }) {
  return error ? <p className="error" role="alert">{error}</p> : null;
}
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status.replace("_", " ")}</span>;
}
