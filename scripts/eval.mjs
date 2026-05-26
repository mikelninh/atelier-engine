// Eval suite for the create-verify engine. Runs against the dev server
// (http://localhost:5173). Each test asserts a behaviour and prints the real
// numbers + outputs. Run: node scripts/eval.mjs
const BASE = process.env.BASE || "http://localhost:5173";

async function post(path, body) {
  const r = await fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

let pass = 0, fail = 0;
const check = (name, ok, detail) => { (ok ? pass++ : fail++); console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`); };

const SNEAKER = "SILHOUETTE: low-top retro court sneaker. UPPER: premium suede, matte. COLOURWAY: base deep forest green; toe tan suede; outsole gum amber; laces off-white. SIGNATURE DETAIL: a tan-suede side panel angled to suggest upward flight. STORY: a tribute to early morning training runs.";
const FLUFF = "Our platform leverages cutting-edge synergies to unlock holistic value across the entire ecosystem, empowering stakeholders to ideate frictionlessly at scale.";
const FACTS = "Write a 2-sentence description of Atelier Engine. Facts: design a sneaker zone-by-zone in 3D (toe, sole, laces) in the browser, free to design, 4 real materials (suede, recycled knit, bio-leather, mesh), made-to-order ~3 weeks, ~229 EUR.";

console.log("\n=== Brick 1: JUDGE (domain-agnostic, evidence-bound) ===");
const jSneaker = await post("/api/judge", { rubricId: "sneaker-design", artifact: SNEAKER, checks: [{ name: "has colourway", pattern: "COLOURWAY" }] });
const jFluff = await post("/api/judge", { rubricId: "writing-clarity", artifact: FLUFF });
check("strong sneaker spec scores high (>=7)", jSneaker.overall >= 7, `got ${jSneaker.overall}`);
check("buzzword prose scores low (<=4)", jFluff.overall <= 4, `got ${jFluff.overall}`);
check("judge discriminates good from bad", jSneaker.overall - jFluff.overall >= 3, `gap ${(jSneaker.overall - jFluff.overall).toFixed(1)}`);
check("deterministic check ran", jSneaker.checks?.[0]?.pass === true, `colourway=${jSneaker.checks?.[0]?.pass}`);

console.log("\n=== Brick 2: LOOP (create-verify, input-bound ceiling) ===");
const lFacts = await post("/api/iterate", { rubricId: "writing-clarity", threshold: 8, maxRounds: 3, brief: FACTS });
const lVague = await post("/api/iterate", { rubricId: "writing-clarity", threshold: 8, maxRounds: 3, brief: "Write a 2-sentence description of Atelier Engine, a sneaker design tool." });
check("fact-rich brief clears the bar (best>=8)", lFacts.best.overall >= 8, `rounds ${lFacts.rounds.map(r => r.overall).join("->")}, best ${lFacts.best.overall}`);
check("vague brief stays below bar (boundary holds)", lVague.best.overall < 8, `best ${lVague.best.overall}`);
check("loop keeps the BEST round, not the last", lFacts.best.overall >= lFacts.rounds.at(-1).overall, `best ${lFacts.best.overall} vs last ${lFacts.rounds.at(-1).overall}`);
console.log("  → cleared-bar artifact:\n    " + lFacts.best.artifact.replace(/\n/g, " ").slice(0, 280));

console.log("\n=== Brick 3: ORCHESTRATOR (decompose -> loop each -> synthesize -> verify) ===");
const o = await post("/api/orchestrate", { rubricId: "writing-clarity", maxParts: 2, threshold: 8, roundsPerPart: 2, goal: "Write a short launch post for Atelier Engine: what it is, who it's for, and how to start. It's a browser tool to design a sneaker zone-by-zone in 3D, free, made-to-order ~229 EUR, publish a numbered drop." });
check("decomposed into parts", o.parts?.length >= 2, `${o.parts?.length} parts`);
check("each part was looped + scored", o.parts?.every(p => p.score > 0), `scores ${o.parts?.map(p => p.score).join(", ")}`);
check("synthesized a final deliverable", typeof o.final === "string" && o.final.length > 40, `${o.final?.length} chars`);
check("final was verified by the judge", o.finalScore > 0, `final score ${o.finalScore}`);
console.log("  → sub-deliverables:");
o.parts.forEach((p, i) => console.log(`    (${i + 1}) [${p.score}] ${p.subgoal}`));
console.log("  → FINAL (score " + o.finalScore + "): " + o.finalSummary + "\n    " + o.final.replace(/\n/g, " ").slice(0, 320));

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===\n`);
process.exit(fail ? 1 : 0);
