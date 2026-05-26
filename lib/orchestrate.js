import { chat, parseJSON } from "./llm";
import { iterate } from "./iterate";
import { judgeArtifact } from "./judge";

// Brick 3 — the orchestrator. Decompose a goal into sub-deliverables, run the
// create-verify loop on each (the specialists), synthesize, then verify the
// whole. Composition + verification — only useful because Bricks 1-2 give it
// eyes and a verdict.
export async function orchestrate({ goal, rubric, maxParts = 2, threshold = 8, roundsPerPart = 2 }) {
  // 1. Decompose.
  const dec = await chat(
    [
      { role: "system", content: `Decompose the GOAL into ${maxParts} independent, concrete sub-deliverables (each a self-contained writing task). Return ONLY JSON: {"parts":["...","..."]}` },
      { role: "user", content: `GOAL: ${goal}` },
    ],
    { maxTokens: 300, temperature: 0.4, json: true }
  );
  const parts = (parseJSON(dec, { parts: [] }).parts || []).slice(0, maxParts);

  // 2. Run the loop on each part (the specialists).
  const built = [];
  for (const p of parts) {
    const r = await iterate({ brief: p, rubric, threshold, maxRounds: roundsPerPart });
    built.push({ subgoal: p, artifact: r.best.artifact, score: r.best.overall });
  }

  // 3. Synthesize into one deliverable.
  const final = (await chat(
    [
      { role: "system", content: `Combine the PARTS into one cohesive deliverable for the GOAL. Tight, concrete, no fluff or repetition. Output ONLY the deliverable.` },
      { role: "user", content: `GOAL: ${goal}\n\nPARTS:\n${built.map((b, i) => `(${i + 1}) ${b.subgoal}\n${b.artifact}`).join("\n\n")}` },
    ],
    { maxTokens: 600, temperature: 0.5 }
  )).trim();

  // 4. Verify the whole.
  const v = await judgeArtifact(final, rubric);
  return { goal, parts: built, final, finalScore: v.overall, finalSummary: v.summary };
}
