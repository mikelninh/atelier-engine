// Proof that the SAME judge generalises to new domains. For each rubric we
// judge a strong and a weak artifact; the engine must rank strong >> weak with
// no code change — only the rubric data differs. Run: node scripts/eval-domains.mjs
const BASE = process.env.BASE || "http://localhost:5173";

async function judge(rubricId, artifact) {
  const r = await fetch(BASE + "/api/judge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rubricId, artifact }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

const CASES = {
  "code-review": {
    strong: `function getUser(db, id) {\n  if (!Number.isInteger(id) || id < 1) throw new Error("invalid id");\n  return db.query("SELECT id, name FROM users WHERE id = $1", [id]);\n}`,
    weak: `function g(d, x) {\n  return d.query("SELECT * FROM users WHERE id = " + x);\n}`,
  },
  "legal-clause": {
    strong: `Limitation of Liability. Except for breaches of confidentiality or indemnity, neither party's aggregate liability under this Agreement shall exceed the fees paid in the 12 months preceding the claim. Neither party is liable for indirect or consequential damages. This limitation applies to the maximum extent permitted by law.`,
    weak: `The Company may, as it deems appropriate, take reasonable actions regarding liability and other matters from time to time.`,
  },
  "cold-email": {
    strong: `Hi Sara — saw Acme just opened a Berlin office. We cut onboarding time 30% for two other Series-B SaaS teams expanding to the EU. Worth a 15-min call Thursday?`,
    weak: `Dear Sir/Madam, I hope this email finds you well. Our innovative cutting-edge platform leverages best-in-class synergies to empower organizations to unlock holistic value at scale across the entire ecosystem. We would love to hop on a call to explore how we can partner together on this exciting journey. Looking forward to connecting and ideating!`,
  },
  "resume-bullet": {
    strong: `Cut checkout abandonment 18% (€1.2M/yr) by rebuilding the payment flow in React and adding Apple Pay, shipping to 400k monthly users.`,
    weak: `Worked on various frontend things and helped improve the website and supported the team with different tasks as needed.`,
  },
};

let pass = 0, fail = 0;
const check = (n, ok, d) => { ok ? pass++ : fail++; console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " — " + d : ""}`); };

for (const [rubric, { strong, weak }] of Object.entries(CASES)) {
  console.log(`\n=== ${rubric} ===`);
  const s = await judge(rubric, strong);
  const w = await judge(rubric, weak);
  console.log(`  strong ${s.overall}/10 — ${s.summary}`);
  console.log(`  weak   ${w.overall}/10 — ${w.summary}`);
  check(`strong scores high (>=7)`, s.overall >= 7, `${s.overall}`);
  check(`weak scores low (<=4)`, w.overall <= 4, `${w.overall}`);
  check(`engine discriminates (gap >=3)`, s.overall - w.overall >= 3, `gap ${(s.overall - w.overall).toFixed(1)}`);
}

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed across ${Object.keys(CASES).length} new domains ===\n`);
process.exit(fail ? 1 : 0);
