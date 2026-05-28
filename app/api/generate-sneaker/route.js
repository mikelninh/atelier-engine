import { buildUserPrompt, buildMatchingSetPrompt, getSystemPrompt, MATCHING_SYSTEM_PROMPT } from "@/lib/productSpec";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image";

// Generates one editorial product image. Three shapes:
//  - single product:  { productType?, modelName, paletteName, materialName, ... }
//  - matching set:     { productType: "set", items: [...], sharedPalette?, ... }
// productType defaults to "sneaker" so existing callers are unchanged.
export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const isSet = body?.productType === "set" || Array.isArray(body?.items);
  const isRaw = typeof body?.rawPrompt === "string" && body.rawPrompt.trim();

  let systemPrompt;
  let userPrompt;
  if (isRaw) {
    // A pre-built prompt (e.g. from the Watch Designer Agent) — render verbatim.
    systemPrompt = body.systemPrompt || getSystemPrompt(body.productType || "watch");
    userPrompt = body.rawPrompt;
  } else if (isSet) {
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return Response.json({ error: "items array is required for a matching set" }, { status: 400 });
    }
    systemPrompt = MATCHING_SYSTEM_PROMPT;
    userPrompt = buildMatchingSetPrompt(body);
  } else {
    const { modelName, paletteName, materialName } = body || {};
    if (!modelName || !paletteName || !materialName) {
      return Response.json({ error: "modelName, paletteName, materialName are required" }, { status: 400 });
    }
    systemPrompt = getSystemPrompt(body.productType || "sneaker");
    userPrompt = buildUserPrompt(body);
  }

  // Free provider: Pollinations (Flux) — no key, no cost. Returns a direct image
  // URL the browser loads on demand. The agent's structured prompt drives it.
  if (body.provider === "free") {
    const safe = `${userPrompt} STRICT: absolutely no text, no numbers, no lettering, no logos or brand names anywhere in the image.`;
    const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(safe)}?width=1024&height=1024&model=flux&nologo=true`;
    return Response.json({ image, prompt: userPrompt, provider: "free" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Response.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });

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
        { role: "system", content: systemPrompt },
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
    prompt: userPrompt,
    inputs: isSet
      ? { productType: "set", items: body.items, sharedPalette: body.sharedPalette || null }
      : { productType: body.productType || "sneaker", modelName: body.modelName, paletteName: body.paletteName, materialName: body.materialName, aiMode: body.aiMode || null, themeId: body.themeId || null, refineNote: body.refineNote || null, signatureFeature: body.signatureFeature || null },
  });
}
