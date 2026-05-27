import fs from "node:fs";
import path from "node:path";

// Human score-overrides — the raw material of the calibration flywheel. Each
// override (judge said X, human said Y) is a labelled example; the sharpest
// disagreements get promoted to rubric anchors so judgment improves with use.
const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "overrides.jsonl");

export function logOverride(o) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.appendFileSync(FILE, JSON.stringify({ ...o, at: Date.now() }) + "\n");
}

export function readOverrides(rubricId) {
  if (!fs.existsSync(FILE)) return [];
  return fs.readFileSync(FILE, "utf8").trim().split("\n").filter(Boolean)
    .map((l) => JSON.parse(l))
    .filter((o) => !rubricId || o.rubricId === rubricId);
}

// Promote the N largest judge-vs-human disagreements into graded anchors.
export function promoteAnchors(rubricId, n = 3) {
  return readOverrides(rubricId)
    .map((o) => ({ ...o, gap: Math.abs((o.judgeScore ?? 0) - (o.humanScore ?? 0)) }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, n)
    .map((o) => ({ score: o.humanScore, artifact: o.artifact, note: o.note || "human-corrected" }));
}
