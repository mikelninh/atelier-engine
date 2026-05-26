import { getRubric } from "@/lib/rubrics";
import { judgeArtifact } from "@/lib/judge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Thin wrapper over the shared judge lib (also used by the iterate loop).
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { artifact, rubricId, checks } = body || {};
  const rubric = body?.rubric || getRubric(rubricId);
  if (!artifact || !rubric) return Response.json({ error: "artifact and rubric (or rubricId) required" }, { status: 400 });

  try {
    return Response.json(await judgeArtifact(artifact, rubric, checks));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
