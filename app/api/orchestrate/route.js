import { getRubric } from "@/lib/rubrics";
import { orchestrate } from "@/lib/orchestrate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Brick 3 as a service: goal + rubric -> decompose -> loop each part -> synthesize -> verify.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { goal, rubricId, maxParts = 2, threshold = 8, roundsPerPart = 2 } = body || {};
  const rubric = body?.rubric || getRubric(rubricId);
  if (!goal || !rubric) return Response.json({ error: "goal and rubric (or rubricId) required" }, { status: 400 });

  try {
    return Response.json(await orchestrate({ goal, rubric, maxParts: Math.min(maxParts, 3), threshold, roundsPerPart: Math.min(roundsPerPart, 3) }));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
