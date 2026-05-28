import { buildUserPrompt } from "@/lib/productSpec";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENROUTER_TEXT_MODEL || "openai/gpt-4o-mini";

// The four designers we interviewed, now rating whether a design meets the
// needs THEY stated. One LLM call returns all four (cost-minimal).
const PANEL = [
  { id: "indie", name: "Indie Customizer", wants: "per-panel control, accurate silhouette, paint-plan output, the shoe stays theirs" },
  { id: "performance", name: "Performance Designer", wants: "manufacturable geometry, locked last, real materials, a buildable tech-pack/spec" },
  { id: "streetwear", name: "Streetwear Creator", wants: "a strong story, on-brand colourways, social-ready look, drop-worthy identity" },
  { id: "sustainability", name: "Sustainability Designer", wants: "honest sourceable materials, no greenwashing, durability, transparency" },
];

const SYSTEM = `You are four sneaker designers reviewing ONE design produced in a GenAI co-designer tool. Each of you earlier described what you want; now rate whether THIS design + its spec meets YOUR stated needs.

The reviewers and what each wants:
${PANEL.map((p) => `- ${p.name}: ${p.wants}`).join("\n")}

Be candid and in-character. Reward real per-zone control, honest materials, a buildable spec, and a clear story; penalise vagueness or anything that ignores your lens.

Return ONLY valid JSON, no markdown:
{"reviews":[{"id":"indie","score":1-10,"verdict":"one candid in-character line under 18 words","unmet":"the single most important thing still missing, under 12 words"}, ...one per reviewer in order]}`;

export async function POST(req) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Response.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const spec = buildUserPrompt(body || {});
  const story = body?.story ? `\nDrop story: ${body.story}` : "";

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
      temperature: 0.8,
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Design spec:\n\n${spec}${story}` },
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
  catch { const m = content.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { reviews: [] }; }

  const byId = Object.fromEntries((parsed.reviews || []).map((r) => [r.id, r]));
  const reviews = PANEL.map((p) => ({
    ...p,
    score: Number(byId[p.id]?.score) || 0,
    verdict: byId[p.id]?.verdict || "",
    unmet: byId[p.id]?.unmet || "",
  }));
  const avg = Math.round((reviews.reduce((s, r) => s + r.score, 0) / reviews.length) * 10) / 10;

  return Response.json({ reviews, avg });
}
