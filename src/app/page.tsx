import Link from "next/link";

export default function Home() {
  return (
    <div className="stack">
      <h1>Rubrics for assessing scientific experimental research</h1>
      <p className="muted">RASER sits alongside the review systems journals already use. Reviewers paste their finished review into those systems.</p>
      <div className="cards">
        <Link href="/designer" className="panel"><h3>Design a rubric</h3><p>Write questions for six fixed sections, set quality thresholds and publish.</p></Link>
        <Link href="/editor" className="panel"><h3>Manage a journal</h3><p>Adopt rubrics, add papers to issues, assign reviewers and send them access links.</p></Link>
        <Link href="/rubrics" className="panel"><h3>Browse published rubrics</h3><p>Read any published rubric as a static page you can link to.</p></Link>
      </div>
      <p>Reviewer? Open the link from your invitation email and enter your PIN.</p>
    </div>
  );
}
