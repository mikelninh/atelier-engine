import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/sneakerPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image";

export async function POST(req) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { modelName, paletteName, materialName, aiMode, refineNote } = body || {};
  if (!modelName || !paletteName || !materialName) {
    return Response.json({ error: "modelName, paletteName, materialName are required" }, { status: 400 });
  }

  const userPrompt = buildUserPrompt({ modelName, paletteName, materialName, aiMode, refineNote });
  const t0 = Date.now();

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
      modalities: ["image", "text"],
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: `OpenRouter ${res.status}`, detail: text.slice(0, 400) }, { status: 502 });
  }

  const json = await res.json();
  const imageUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) {
    return Response.json({ error: "No image returned", raw: JSON.stringify(json).slice(0, 400) }, { status: 502 });
  }

  return Response.json({
    image: imageUrl,
    elapsedMs: Date.now() - t0,
    inputs: { modelName, paletteName, materialName, aiMode, refineNote: refineNote || null },
  });
}
