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
};

export function getRubric(id) {
  return RUBRICS[id] || null;
}
