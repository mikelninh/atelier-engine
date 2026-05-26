import { chat } from "./llm";
import { judgeArtifact } from "./judge";

// Default generator: produces or revises a text artifact for a brief. When
// given the prior artifact + the judge's fixes, it revises to address every
// fix while keeping what worked. Domain-agnostic — the rubric decides "good".
async function defaultGenerate({ brief, prior, fixes }) {
  const SYSTEM = `You produce a single ARTIFACT for the BRIEF. If a PRIOR ARTIFACT and FIXES are given, revise it to address EVERY fix while keeping what already works. Output ONLY the artifact itself — no preamble, no commentary, no markdown fences.`;
  const user = prior
    ? `BRIEF: ${brief}\n\nPRIOR ARTIFACT:\n${prior}\n\nFIXES TO ADDRESS:\n${fixes.map((f) => `- ${f}`).join("\n")}`
    : `BRIEF: ${brief}`;
  return (await chat([{ role: "system", content: SYSTEM }, { role: "user", content: user }], { maxTokens: 600, temperature: 0.6 })).trim();
}

// The create-and-verify loop. generate → judge → feed fixes back → repeat
// until the artifact clears `threshold`, hits `maxRounds`, or stops improving
// (plateau, to save cost). Returns every round + the best artifact found.
export async function iterate({
  brief,
  rubric,
  checks = [],
  threshold = 8,
  maxRounds = 3,
  generate = defaultGenerate,
}) {
  const rounds = [];
  let artifact = await generate({ brief, prior: null, fixes: null });
  let best = null;

  for (let r = 1; r <= maxRounds; r++) {
    const verdict = await judgeArtifact(artifact, rubric, checks);
    rounds.push({ round: r, artifact, overall: verdict.overall, summary: verdict.summary, criteria: verdict.criteria });
    if (!best || verdict.overall > best.overall) best = { round: r, artifact, overall: verdict.overall, summary: verdict.summary };

    if (verdict.overall >= threshold) break;                       // cleared the bar
    if (r >= 2 && verdict.overall <= rounds[r - 2].overall) break;  // plateau / regression — stop spending
    if (r === maxRounds) break;

    const fixes = verdict.criteria.filter((c) => c.score < threshold).map((c) => c.fix).filter(Boolean);
    artifact = await generate({ brief, prior: artifact, fixes });
  }

  return { brief, threshold, rounds, best, reachedBar: best.overall >= threshold };
}
