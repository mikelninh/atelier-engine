// Closed-loop proof: capture human overrides -> promote the sharpest
// disagreements to anchors -> re-measure on UNSEEN items. Teaches an
// org-specific standard (we cap unvalidated code at ~4) the model's default
// doesn't share. Run: node scripts/flywheel.mjs
import { promoteAnchors } from "../lib/overrides.js";
const BASE = process.env.BASE || "http://localhost:5173";
const RID = "code-review-fw";

const criteria = [
  { id: "correctness", name: "Correctness", weight: 3, guide: "Does what it claims; edge cases handled." },
  { id: "robustness", name: "Robustness", weight: 3, guide: "Validates inputs, handles nulls/errors. Our standard: ANY missing input validation caps the function low." },
  { id: "clarity", name: "Clarity", weight: 1, guide: "Clear names, readable." },
];

async function judge(rubric, artifact) {
  const r = await fetch(BASE + "/api/judge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rubric, artifact }) });
  return (await r.json()).overall;
}
async function override(o) {
  await fetch(BASE + "/api/override", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rubricId: RID, ...o }) });
}

// Feedback: humans correcting the judge to OUR strict-validation standard.
const feedback = [
  { artifact: `function area(w,h){ return w*h; }`, humanScore: 4, note: "no input validation -> capped" },
  { artifact: `function area(w,h){ if(w<=0||h<=0) throw new Error("positive"); return w*h; }`, humanScore: 9, note: "validated" },
];
// Held-out test set (unseen) with our reference scores.
const test = [
  { artifact: `function discount(p,r){ return p*(1-r); }`, ref: 4 },
  { artifact: `function discount(p,r){ if(p<0||r<0||r>1) throw new Error("range"); return p*(1-r); }`, ref: 9 },
  { artifact: `function initials(name){ return name.split(" ").map(x=>x[0]).join(""); }`, ref: 4 },
];

const baseRubric = { name: RID, criteria };

console.log("\n1) Capture overrides (judge each feedback item, log the human correction)...");
for (const f of feedback) {
  const judgeScore = await judge(baseRubric, f.artifact);
  await override({ artifact: f.artifact, judgeScore, humanScore: f.humanScore, note: f.note });
  console.log(`   judge ${judgeScore} -> human ${f.humanScore}  (${f.note})`);
}

console.log("\n2) Promote sharpest disagreements to anchors...");
const anchors = promoteAnchors(RID, 2);
anchors.forEach((a) => console.log(`   [${a.score}/10] ${a.artifact.slice(0, 48)}…`));
const calibrated = { name: RID, criteria, examples: anchors };

console.log("\n3) Re-measure on UNSEEN test set (ref | before | after):");
let mb = 0, ma = 0;
for (const t of test) {
  const b = await judge(baseRubric, t.artifact);
  const a = await judge(calibrated, t.artifact);
  mb += Math.abs(b - t.ref); ma += Math.abs(a - t.ref);
  console.log(`    ${t.ref}  | ${String(b).padStart(4)} | ${a}`);
}
mb /= test.length; ma /= test.length;
console.log(`\n   MAE vs our standard — before: ${mb.toFixed(2)}   after: ${ma.toFixed(2)}`);
console.log(`   ${ma < mb ? "PASS" : "NO-GAIN"}  the flywheel ${ma < mb ? "tightened" : "did not tighten"} judgment toward our standard\n`);
