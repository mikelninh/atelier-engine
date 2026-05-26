// Calibration proof: does adding graded anchors make the judge agree more with
// reference ("human") scores on a HELD-OUT gold set? Same rubric, two versions
// (no anchors vs anchored). Lower MAE = better calibrated. Run: node scripts/calibrate.mjs
const BASE = process.env.BASE || "http://localhost:5173";

const criteria = [
  { id: "correctness", name: "Correctness", weight: 3, guide: "Does what it claims; no logic bugs; edge cases handled." },
  { id: "robustness", name: "Robustness", weight: 2, guide: "Validates inputs, handles errors/nulls, no crash paths." },
  { id: "security", name: "Security", weight: 2, guide: "No injection, no unsafe eval/exec, safe data handling." },
  { id: "clarity", name: "Clarity", weight: 1, guide: "Clear names, small scope, readable." },
];

// Graded anchors — distinct from the gold set (no leakage).
const examples = [
  { score: 9, artifact: `function add(a,b){ if(typeof a!=="number"||typeof b!=="number") throw new Error("nums"); return a+b; }`, note: "validated, clear" },
  { score: 5, artifact: `function add(a,b){ return a+b; }`, note: "works, no validation" },
  { score: 2, artifact: `function q(d,x){ return d.query("SELECT * FROM t WHERE id="+x); }`, note: "SQL injection, no validation" },
];

// Held-out gold set with reference (engineer) scores.
const gold = [
  { ref: 9, artifact: `function getUser(db,id){ if(!Number.isInteger(id)||id<1) throw new Error("invalid id"); return db.query("SELECT id,name FROM users WHERE id=$1",[id]); }` },
  { ref: 6, artifact: `function slug(s){ return s.toLowerCase().replace(/ /g,"-"); }` },
  { ref: 3, artifact: `function load(p){ return eval(require("fs").readFileSync(p,"utf8")); }` },
  { ref: 7, artifact: `async function fetchJSON(u){ const r=await fetch(u); if(!r.ok) throw new Error(r.status); return r.json(); }` },
];

async function judge(rubric, artifact) {
  const r = await fetch(BASE + "/api/judge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rubric, artifact }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j.overall;
}

const base = { name: "code-review", criteria };
const calibrated = { name: "code-review", criteria, examples };

let maeBase = 0, maeCal = 0;
console.log("\n  ref | base | anchored   (held-out gold set)");
for (const g of gold) {
  const b = await judge(base, g.artifact);
  const c = await judge(calibrated, g.artifact);
  maeBase += Math.abs(b - g.ref);
  maeCal += Math.abs(c - g.ref);
  console.log(`   ${g.ref}  |  ${b.toString().padStart(3)} |   ${c}`);
}
maeBase /= gold.length; maeCal /= gold.length;
console.log(`\n  MAE vs reference — base: ${maeBase.toFixed(2)}   anchored: ${maeCal.toFixed(2)}`);
console.log(`  ${maeCal < maeBase ? "PASS" : "NO-GAIN"}  anchors ${maeCal < maeBase ? "improved" : "did not improve"} agreement (lower is better)\n`);
