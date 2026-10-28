"use client";
import { useState } from "react";
import { RATINGS, RATING_LABELS, type Question } from "@/entities/types";
import { designer, type QuestionInput } from "@/control/controllers";
import { ErrorBanner, useRun } from "./hooks";

export function QuestionForm({ initial, onSave, onCancel }: { initial?: Question; onSave: (q: QuestionInput) => void; onCancel: () => void }) {
  const [text, setText] = useState(initial?.text ?? "");
  const [ex, setEx] = useState(initial?.explanations ?? designer.blank());
  const { error, run } = useRun();
  return (
    <form className="panel stack" onSubmit={(e) => { e.preventDefault(); run(() => { onSave({ text, explanations: ex }); }); }}>
      <label>Question<textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} /></label>
      {RATINGS.map((r) => (
        <label key={r}>{r} – {RATING_LABELS[r]}
          <textarea value={ex[r]} rows={2} onChange={(e) => setEx({ ...ex, [r]: e.target.value })} />
        </label>
      ))}
      <ErrorBanner error={error} />
      <div className="row"><button className="primary" type="submit">Save question</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}
