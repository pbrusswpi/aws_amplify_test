"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDB, useReady } from "@/control/store";
import { RubricView } from "@/boundary/RubricView";

export default function ViewRubric() {
  const { id } = useParams<{ id: string }>();
  const db = useDB(); const ready = useReady();
  if (!ready) return <p>Loading…</p>;
  const rubric = db.rubrics.find((r) => r.id === id && r.status !== "draft");
  if (!rubric) return <p>This rubric is not published. <Link href="/rubrics">See published rubrics</Link></p>;
  return <RubricView rubric={rubric} replacement={db.rubrics.find((r) => r.id === rubric.replacedBy)} />;
}
