// Single place the OpenRouter chat call lives. Keep max_tokens modest — the
// account runs on a tight credit ceiling.
const MODEL = process.env.OPENROUTER_TEXT_MODEL || "openai/gpt-4o-mini";

export async function chat(messages, { maxTokens = 700, temperature = 0.4, json = false } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

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
      temperature,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export function parseJSON(content, fallback = {}) {
  try { return JSON.parse(content); }
  catch { const m = content.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : fallback; }
}
