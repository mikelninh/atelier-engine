import { getRubric } from "@/lib/rubrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENROUTER_TEXT_MODEL || "openai/gpt-4o-mini";

// The domain-agnostic judge. Give it ANY artifact (text/spec) + a rubric, get
// back evidence-bound, weighted scores + fixes. Swap the rubric, judge a new
// domain — the engine never changes. This is the reusable-judgment primitive.
export async function POST(req) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Response.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { artifact, rubricId, checks } = body || {};
  const rubric = body?.rubric || getRubric(rubricId);
  if (!artifact || !rubric) return Response.json({ error: "artifact and rubric (or rubricId) required" }, { status: 400 });

  // Deterministic checks run first — cheap certainties that never bluff.
  const checkResults = Array.isArray(checks)
    ? checks.map((c) => ({ name: c.name, pass: new RegExp(c.pattern, c.flags || "i").test(artifact) }))
    : [];

  const SYSTEM = `You are an impartial, calibrated evaluator. Judge the ARTIFACT strictly against the RUBRIC.
For each criterion: a score 1-10, the specific EVIDENCE from the artifact you based it on (or note its absence), and one concrete FIX.
Be critical and calibrated — reserve 9-10 for genuinely excellent work; most first drafts are 4-7. Do not reward vagueness.
${rubric.anchors ? `Calibration — a high example: "${rubric.anchors.high}"; a low example: "${rubric.anchors.low}".` : ""}
Return ONLY valid JSON:
{"criteria":[{"id":"...","score":1-10,"evidence":"under 22 words","fix":"under 14 words"}],"summary":"one-line verdict under 18 words"}
Criteria to score (use these exact ids): ${rubric.criteria.map((c) => `${c.id} (${c.name}: ${c.guide})`).join(" | ")}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/mikelninh/atelier-engine",
      "X-Title": "Atelier Engine",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `ARTIFACT:\n\n${artifact}` },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: `OpenRouter ${res.status}`, detail: text.slice(0, 300) }, { status: 502 });
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || "{}";
  let parsed;
  try { parsed = JSON.parse(content); }
  catch { const m = content.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { criteria: [] }; }

  // Weighted overall from the rubric weights.
  const byId = Object.fromEntries((parsed.criteria || []).map((c) => [c.id, c]));
  let wsum = 0, w = 0;
  const criteria = rubric.criteria.map((c) => {
    const r = byId[c.id] || {};
    const score = Number(r.score) || 0;
    wsum += score * (c.weight || 1); w += (c.weight || 1);
    return { id: c.id, name: c.name, weight: c.weight || 1, score, evidence: r.evidence || "", fix: r.fix || "" };
  });
  const overall = w ? Math.round((wsum / w) * 10) / 10 : 0;

  return Response.json({ rubric: rubric.name, overall, criteria, checks: checkResults, summary: parsed.summary || "" });
}
