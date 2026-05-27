import { logOverride, readOverrides } from "@/lib/overrides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Capture a human score-override (the flywheel's input). In product this fires
// whenever a user corrects the judge.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const { rubricId, artifact, judgeScore, humanScore, note } = body || {};
  if (!rubricId || artifact == null || humanScore == null) {
    return Response.json({ error: "rubricId, artifact, humanScore required" }, { status: 400 });
  }
  logOverride({ rubricId, artifact, judgeScore, humanScore, note });
  return Response.json({ ok: true, count: readOverrides(rubricId).length });
}
