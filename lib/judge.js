import { chat, parseJSON } from "./llm";

// Domain-agnostic judge: artifact + rubric (+ optional deterministic checks)
// -> evidence-bound, weighted verdict. The engine never changes per domain.
export async function judgeArtifact(artifact, rubric, checks = []) {
  const checkResults = Array.isArray(checks)
    ? checks.map((c) => ({ name: c.name, pass: new RegExp(c.pattern, c.flags || "i").test(artifact) }))
    : [];

  const SYSTEM = `You are an impartial, calibrated evaluator. Judge the ARTIFACT strictly against the RUBRIC.
For each criterion: a score 1-10, the specific EVIDENCE from the artifact (or note its absence), and one concrete FIX.
Be critical and calibrated — reserve 9-10 for genuinely excellent work; most drafts are 4-7. Do not reward vagueness.
${rubric.anchors ? `Calibration — high: "${rubric.anchors.high}"; low: "${rubric.anchors.low}".` : ""}
Return ONLY valid JSON:
{"criteria":[{"id":"...","score":1-10,"evidence":"under 22 words","fix":"under 14 words"}],"summary":"under 18 words"}
Criteria (use these exact ids): ${rubric.criteria.map((c) => `${c.id} (${c.name}: ${c.guide})`).join(" | ")}`;

  const content = await chat(
    [{ role: "system", content: SYSTEM }, { role: "user", content: `ARTIFACT:\n\n${artifact}` }],
    { maxTokens: 700, temperature: 0.3, json: true }
  );
  const parsed = parseJSON(content, { criteria: [] });

  const byId = Object.fromEntries((parsed.criteria || []).map((c) => [c.id, c]));
  let wsum = 0, w = 0;
  const criteria = rubric.criteria.map((c) => {
    const r = byId[c.id] || {};
    const score = Number(r.score) || 0;
    wsum += score * (c.weight || 1); w += (c.weight || 1);
    return { id: c.id, name: c.name, weight: c.weight || 1, score, evidence: r.evidence || "", fix: r.fix || "" };
  });
  const overall = w ? Math.round((wsum / w) * 10) / 10 : 0;
  return { rubric: rubric.name, overall, criteria, checks: checkResults, summary: parsed.summary || "" };
}
