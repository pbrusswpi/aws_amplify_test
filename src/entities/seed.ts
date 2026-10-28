import type { Question, Rubric, Section } from "./types";

const q = (section: Section, text: string, crit: string): Question => ({
  id: crypto.randomUUID(), section, text,
  explanations: {
    5: `Fully met: ${crit}`, 4: `Mostly met, minor gap: ${crit}`, 3: `Partially met: ${crit}`,
    2: `Largely unmet: ${crit}`, 1: `Not reported: ${crit}`,
  },
});

/** Small sample so the app is usable on first load. */
export const seedRubric = (): Rubric => ({
  id: crypto.randomUUID(),
  name: "In Vitro – Plant Rubric",
  status: "published",
  publishedAt: new Date().toISOString(),
  lowThreshold: 20,
  highThreshold: 27,
  questions: [
    q("Introduction", "Is the research question and hypothesis clearly stated?", "question and hypothesis are explicit"),
    q("Materials & Sourcing", "Are plant lines, media and reagents identified with sources?", "accessions, suppliers and catalogue numbers given"),
    q("Methodology & Reproducibility", "Are culture conditions described well enough to repeat?", "light, temperature, medium and timing specified"),
    q("Replication", "Are biological and technical replicates reported?", "number and type of replicates stated"),
    q("Risk of Bias & Statistics", "Are statistical tests justified and randomization described?", "tests, assumptions and randomization stated"),
    q("Reporting & Transparency", "Are raw data and protocols available?", "data and protocols deposited and linked"),
  ],
});
