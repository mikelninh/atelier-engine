import { getRubric } from "@/lib/rubrics";
import { iterate } from "@/lib/iterate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Brick 2 — the create-and-verify loop as a service. Give it a brief + a
// rubric; it generates, judges, feeds the fixes back, and iterates until the
// bar (or a plateau). The reusable self-improving loop.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { brief, rubricId, checks, threshold = 8, maxRounds = 3 } = body || {};
  const rubric = body?.rubric || getRubric(rubricId);
  if (!brief || !rubric) return Response.json({ error: "brief and rubric (or rubricId) required" }, { status: 400 });

  try {
    const result = await iterate({ brief, rubric, checks, threshold, maxRounds: Math.min(maxRounds, 4) });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
