import { designWatchIterated } from "@/lib/watchDesigner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The Watch Designer Agent: a vibe in, a critiqued + iterated watch design out
// (structured spec + a designer-grade render prompt). Render the image by
// POSTing { rawPrompt } to /api/generate-sneaker.
export async function POST(req) {
  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const vibe = (body?.vibe || "").trim();
  if (!vibe) return Response.json({ error: "vibe is required" }, { status: 400 });

  const rounds = Math.min(Math.max(Number(body.rounds) || 2, 1), 3);
  const threshold = Math.min(Math.max(Number(body.threshold) || 8, 1), 10);
  try {
    const result = await designWatchIterated(vibe, { rounds, threshold });
    return Response.json(result);
  } catch (e) {
    if (/\b402\b/.test(e.message)) {
      return Response.json({ error: "OpenRouter credits exhausted — top up at openrouter.ai/settings/credits" }, { status: 402 });
    }
    return Response.json({ error: e.message }, { status: 502 });
  }
}
