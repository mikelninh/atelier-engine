import { buildUserPrompt } from "@/lib/sneakerPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENROUTER_TEXT_MODEL || "openai/gpt-4o-mini";

// A fixed panel of sneaker-world archetypes. Each reacts in character to the
// design spec — this is a taste signal ("would they cop?"), not real research.
const PANEL = [
  { id: "mara", name: "Mara", role: "quiet-luxury footwear designer", lens: "proportion, restraint, material honesty; allergic to clutter" },
  { id: "dex", name: "Dex", role: "hype reseller / sneaker-flipper", lens: "resale heat, scarcity, instant recognisability across a room" },
  { id: "tomas", name: "Tomas", role: "performance runner", lens: "function, fit, whether the tech reads as real or fake" },
  { id: "lena", name: "Lena", role: "sustainability-first buyer", lens: "materials, longevity, whether it's honest or greenwashed" },
  { id: "kai", name: "Kai", role: "Gen-Z streetwear fan", lens: "fit-check energy, vibe, would it post well" },
];

const SYSTEM = `You are a panel of distinct sneaker-world personas reacting to ONE new sneaker design described as a spec sheet.

The panel:
${PANEL.map((p) => `- ${p.name}, ${p.role} — judges by: ${p.lens}`).join("\n")}

For each persona, react strictly in their voice and taste. Be candid — some should dislike it if it doesn't fit their lens. Avoid generic praise.

Return ONLY valid JSON, no markdown, in this exact shape:
{"reactions":[{"id":"mara","verdict":"love|like|meh|pass","wouldCop":true,"quote":"one punchy in-character line, under 18 words","improvement":"one concrete change, under 14 words"}, ...one object per persona in panel order]}`;

export async function POST(req) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Response.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const spec = buildUserPrompt(body || {});

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
      temperature: 0.9,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Here is the design spec:\n\n${spec}` },
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
  try {
    parsed = JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : { reactions: [] };
  }

  const byId = Object.fromEntries((parsed.reactions || []).map((r) => [r.id, r]));
  const reactions = PANEL.map((p) => ({
    ...p,
    verdict: byId[p.id]?.verdict || "meh",
    wouldCop: Boolean(byId[p.id]?.wouldCop),
    quote: byId[p.id]?.quote || "",
    improvement: byId[p.id]?.improvement || "",
  }));
  const copCount = reactions.filter((r) => r.wouldCop).length;

  return Response.json({ reactions, copCount, total: PANEL.length });
}
