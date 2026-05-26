// Rubrics are DATA; the judge (lib + /api/judge) is domain-agnostic. To make
// judgment reusable in a new domain you write a rubric here — you do not touch
// the judge. Each criterion carries a `guide` (what good looks like) and a
// `weight`; optional `anchors` calibrate the scale (a 9 vs a 3). Human score
// overrides become new anchors over time — that's where judgment improves.

export const RUBRICS = {
  "sneaker-design": {
    name: "Sneaker design quality",
    criteria: [
      { id: "zone_coherence", name: "Colourway coherence", weight: 2, guide: "The per-zone colours read as one intentional colourway, not random." },
      { id: "signature", name: "One iconic feature", weight: 2, guide: "A single strong signature detail leads; the rest stays restrained (not a committee shoe)." },
      { id: "material_honesty", name: "Material honesty", weight: 1, guide: "Materials are real and plausible for the silhouette; no fantasy/greenwashed materials." },
      { id: "buildable", name: "Buildable spec", weight: 2, guide: "The spec is specific enough that a sample room could make it (zones, materials, construction named)." },
      { id: "story", name: "Story / point of view", weight: 1, guide: "There's a clear reason this design exists; it's not generic." },
    ],
    anchors: { high: "Forest-green suede court low with one tan-suede flight panel, gum sole, full zone spec + a clear training-run story.", low: "A vibrant futuristic eco sneaker, cool vibes." },
  },
  "writing-clarity": {
    name: "Writing clarity (domain-agnostic prose)",
    criteria: [
      { id: "clarity", name: "Clarity", weight: 2, guide: "Each sentence is unambiguous; a smart non-expert follows it on first read." },
      { id: "concreteness", name: "Concreteness", weight: 2, guide: "Claims are specific and grounded, not abstract hand-waving." },
      { id: "structure", name: "Structure", weight: 1, guide: "Ideas are ordered so each builds on the last." },
      { id: "no_fluff", name: "No fluff", weight: 1, guide: "No filler, hedging, or marketing padding; every sentence earns its place." },
    ],
    anchors: { high: "Tight, concrete, ordered; cuts straight to the point with examples.", low: "Long, abstract, full of 'leverage synergies to unlock value'." },
  },
  "code-review": {
    name: "Code review (a function/diff)",
    criteria: [
      { id: "correctness", name: "Correctness", weight: 3, guide: "Does what it claims; no logic bugs; edge cases handled." },
      { id: "robustness", name: "Robustness", weight: 2, guide: "Validates inputs, handles errors/nulls, no obvious crash paths." },
      { id: "security", name: "Security", weight: 2, guide: "No injection, no secrets, no unsafe eval/exec, safe data handling." },
      { id: "clarity", name: "Clarity", weight: 1, guide: "Clear names, small scope, readable without comments." },
    ],
    anchors: { high: "Validated inputs, parameterised queries, handled edge cases, clear names.", low: "String-concatenated SQL, no validation, one-letter names, silent failures." },
  },
  "legal-clause": {
    name: "Contract clause quality",
    criteria: [
      { id: "clarity", name: "Clarity", weight: 2, guide: "Unambiguous; a non-lawyer grasps the obligation and who it binds." },
      { id: "completeness", name: "Completeness", weight: 2, guide: "Covers scope, exceptions, duration, remedy — no dangling gaps." },
      { id: "balance", name: "Balance / fairness", weight: 2, guide: "Not unconscionably one-sided; obligations are mutual where expected." },
      { id: "enforceability", name: "Enforceability", weight: 1, guide: "Specific and definite enough to be enforced; no vague 'reasonable efforts' alone." },
    ],
    anchors: { high: "Defines the obligation, scope, carve-outs, duration and remedy in plain, mutual terms.", low: "'Party may do things as appropriate' — vague, one-sided, no scope or remedy." },
  },
  "cold-email": {
    name: "Cold outreach email (reply-worthiness)",
    criteria: [
      { id: "relevance", name: "Relevance / personalization", weight: 2, guide: "Clearly written for THIS recipient, not a blast; a specific reason to care." },
      { id: "brevity", name: "Brevity", weight: 2, guide: "Short enough to read in 15 seconds; no padding." },
      { id: "value", name: "Specific value", weight: 2, guide: "A concrete, credible benefit — not 'synergies' or 'solutions'." },
      { id: "cta", name: "Clear ask", weight: 1, guide: "One easy, specific next step." },
    ],
    anchors: { high: "Two lines, names a real trigger, one concrete benefit, a yes/no ask.", low: "Six paragraphs about the sender, buzzwords, 'let's hop on a call to explore synergies'." },
  },
  "resume-bullet": {
    name: "Résumé bullet strength",
    criteria: [
      { id: "impact", name: "Quantified impact", weight: 3, guide: "A measurable result with numbers (%, time, money, scale)." },
      { id: "ownership", name: "Action & ownership", weight: 2, guide: "Strong verb; clear what THIS person did, not the team." },
      { id: "specificity", name: "Specificity", weight: 2, guide: "Concrete what/how (tools, method), not vague 'various tasks'." },
      { id: "concise", name: "Concise", weight: 1, guide: "One tight line; no filler." },
    ],
    anchors: { high: "Cut API p95 latency 40% (820→490ms) by adding Redis caching, serving 2M req/day.", low: "Responsible for helping with various backend tasks and supporting the team." },
  },
};

export function getRubric(id) {
  return RUBRICS[id] || null;
}
