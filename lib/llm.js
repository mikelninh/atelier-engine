// Single place the OpenRouter chat call lives. Keep max_tokens modest — the
// account runs on a tight credit ceiling.
const MODEL = process.env.OPENROUTER_TEXT_MODEL || "openai/gpt-4o-mini";

// `schema` ({ name, schema }) requests strict JSON-Schema structured output —
// the model must return JSON matching the schema exactly. `json: true` is the
// looser json_object mode. Pass at most one.
export async function chat(messages, { maxTokens = 700, temperature = 0.4, json = false, schema = null } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  async function call(responseFormat, msgs) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/mikelninh/atelier-engine",
        "X-Title": "Atelier Engine",
      },
      body: JSON.stringify({ model: MODEL, temperature, max_tokens: maxTokens, ...responseFormat, messages: msgs }),
    });
    return res;
  }

  let res;
  if (schema) {
    res = await call({ response_format: { type: "json_schema", json_schema: { name: schema.name || "response", strict: true, schema: schema.schema || schema } } }, messages);
    // Fallback: if a provider rejects strict json_schema, retry once in the
    // looser json_object mode with the schema described in the system message,
    // so the agent works regardless of which provider OpenRouter routes to.
    if (!res.ok && res.status !== 402) {
      const errText = await res.text();
      if (/response_format|json[_\s-]?schema|schema/i.test(errText)) {
        const msgs = [
          { role: "system", content: `Return ONLY JSON matching this schema exactly:\n${JSON.stringify(schema.schema || schema)}` },
          ...messages,
        ];
        res = await call({ response_format: { type: "json_object" } }, msgs);
      } else {
        throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 200)}`);
      }
    }
  } else {
    res = await call(json ? { response_format: { type: "json_object" } } : {}, messages);
  }

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
