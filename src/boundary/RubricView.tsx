import Link from "next/link";
import { RATINGS, RATING_LABELS, SECTIONS, fmtDate, maxScore, orderedQuestions, type Rubric } from "@/entities/types";
import { StatusBadge } from "./hooks";

export function RubricView({ rubric, replacement }: { rubric: Rubric; replacement?: Rubric }) {
  const ordered = orderedQuestions(rubric);
  const number = (id: string) => ordered.findIndex((q) => q.id === id) + 1;
  return (
    <article>
      <header className="stack">
        <h1>{rubric.name} <StatusBadge status={rubric.status} /></h1>
        {rubric.status === "deprecated" && (
          <p className="notice">This rubric is deprecated.{" "}
            {replacement ? <>Use <Link href={`/rubrics/${replacement.id}`}>{replacement.name}</Link> instead.</> : "Use a newer published rubric."}</p>
        )}
        <dl className="meta">
          <div><dt>Maximum score</dt><dd>{maxScore(rubric)}</dd></div>
          <div><dt>Low quality below</dt><dd>{rubric.lowThreshold}</dd></div>
          <div><dt>High quality from</dt><dd>{rubric.highThreshold}</dd></div>
          <div><dt>Published</dt><dd>{fmtDate(rubric.publishedAt)}</dd></div>
          <div><dt>Deprecated</dt><dd>{fmtDate(rubric.deprecatedAt)}</dd></div>
        </dl>
      </header>
      {SECTIONS.map((s) => {
        const qs = rubric.questions.filter((q) => q.section === s);
        return (
          <section key={s} className="stack">
            <h2>{s}</h2>
            {qs.length === 0 && <p className="muted">No questions in this section.</p>}
            {qs.map((q) => (
              <div className="panel" key={q.id}>
                <h3>{number(q.id)}. {q.text}</h3>
                <dl className="ratings">
                  {RATINGS.map((r) => (<div key={r}><dt>{r} – {RATING_LABELS[r]}</dt><dd>{q.explanations[r] || "—"}</dd></div>))}
                </dl>
              </div>
            ))}
          </section>
        );
      })}
    </article>
  );
}
