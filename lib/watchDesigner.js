import { chat, parseJSON } from "./llm";
import { iterate } from "./iterate";
import { getRubric } from "./rubrics";
import { renderWatchRules } from "./productSpec";

// The Watch Designer Agent — the jump from "data table fills a template" to
// "a watch designer designs, critiques itself, iterates".
//
// designWatch() turns a vibe into a coherent, proportion-aware watch SPEC via
// strict JSON-Schema structured output (the designer's brain). renderWatchPrompt()
// turns that spec into an evocative, designer-grade image prompt (the brief a
// real product shoot would get). designWatchIterated() wraps both in the
// create-verify loop: design → judge against the watch rubric → feed the
// critique back → redesign, keeping the best.

// Strict structured-output schema. Every object lists all keys in `required`
// and sets additionalProperties:false — OpenAI/OpenRouter strict mode demands it.
const obj = (properties) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});
const str = (description) => ({ type: "string", description });
const num = (description) => ({ type: "number", description });

export const WATCH_SCHEMA = {
  name: "watch_design",
  schema: obj({
    name: str("evocative product name, 1–3 words"),
    archetype: str("the watch archetype, e.g. 'integrated-bracelet luxury sports watch'"),
    designDNA: str("the brand-neutral formal language it evokes (e.g. Genta school, 1940s scientific, military diver) — never name a real brand"),
    story: str("one-sentence point of view: why this watch exists"),
    casebackIntention: str("a short engraved intention / mantra for the caseback, in the brand's calm spiritual voice (e.g. 'Move in rhythm with the invisible')"),
    movement: str("movement type and a plausible calibre family, e.g. 'automatic three-hand, NH35-class' or 'mechanical chronograph' — must be coherent with the archetype and complication"),
    caseSpec: obj({
      diameterMm: num("case diameter in mm, chosen for harmony with the archetype"),
      thicknessMm: num("case thickness in mm"),
      lugToLugMm: num("lug-to-lug in mm; use 0 if the bracelet is integrated with no separate lugs"),
      shape: str("case shape and silhouette"),
      material: str("case material and colour/tone"),
      finishing: str("surface finishing — brushed/polished interplay, chamfers, etc."),
    }),
    dial: obj({
      base: str("dial construction (sunburst, sandwich, openworked, grand feu enamel, aventurine, sector…)"),
      color: str("dial colour"),
      texture: str("texture/pattern (waffle guilloché, mandala, frosted, fumé gradient, sunburst…)"),
      openness: str("how open/legible the layout is; negative space and dial furniture"),
    }),
    markers: obj({ style: str("marker style/shape"), material: str("marker material/finish"), lume: str("lume treatment or 'none'") }),
    hands: obj({ shape: str("hand shape (dauphine, leaf, breguet, snowflake, syringe…)"), finish: str("hand finish"), lume: str("lume or 'none'") }),
    bezel: str("bezel description or 'no separate bezel'"),
    crystal: str("crystal type (flat/domed/box sapphire…)"),
    complication: str("complication(s) (date, moonphase, chronograph, small-seconds, time-only…)"),
    strap: str("strap or bracelet"),
    heroGesture: str("the SINGLE iconic focal point that makes this watch unforgettable"),
    proportionRationale: str("one sentence: why these proportions read as harmonious"),
    moodLighting: str("the lighting & mood for the hero shot (dramatic, soft luxury, jewel-like…)"),
    photoDirection: str("camera angle, depth of field, backdrop for the product shot"),
    retailTierEur: str("suggested retail range in EUR, e.g. '€299–449'"),
  }),
};

const DESIGNER_SYSTEM = `You are the head designer of ONE watch house with a single, unmistakable identity. Every design must obviously belong to this brand — never a generic round watch, never a committee design.

HOUSE IDENTITY — "SATORI · integrated-sport horology with a zen / archetype soul":
- FORM (non-negotiable, brand-OWN DNA — never a Royal Oak homage):
  · a SOFT HEXAGONAL bezel — six sides with gently rounded vertices, read as a mandala / sacred geometry
  · COMPLETELY SMOOTH AND SCREWLESS bezel (absolutely no exposed screws, no bolts, no hex screws — this is the explicit break from the Royal Oak / Genta school)
  · brushed top surface meeting mirror-polished chamfered edges where the hexagon facets join — the finishing IS the premium signal
  · tapered integrated bracelet (or matching strap) flowing seamlessly from the case with no separate lugs
  · ULTRA-THIN profile (8–10mm), broad open dial as the hero
- SIGNATURE DIAL (always the hero, never plain/flat): richly textured or cosmic — fine waffle guilloché, meteorite (Widmanstätten lattice), deep aventurine starfield, or an engraved 'temple-circuit' concentric mandala. The dial texture is what makes the brand recognisable across the whole collection.
- SOUL: each model is an ARCHETYPE bridging spiritual / zen life and modern design — in the spirit of Temple Circuit, Meteorite Monk, Aventurine Moon Priest, Lotus Diver, Ashram Racer. The name, story and engraved caseback intention carry meaning, ritual, calm.
- FINISHING & LIGHT (premium = 80% here): brushed tops against mirror-polished chamfered bevels, applied faceted white-gold markers, crisp high-contrast jewel-like presentation, dramatic single-source light on a dark volcanic-stone backdrop.

Think like a watch designer: choose harmonious proportions and justify them in proportionRationale; commit to exactly ONE hero gesture; keep movement, material and complication coherent; stay brand-neutral in the render (evoke the language, never name or copy a real maker, NEVER reproduce the Royal Oak octagonal-with-screws geometry).

The calibre to match: H. Moser Streamliner's restrained luxury and Czapek Antarctique's hexagonal poise, crossed with a meditative archetype and a cosmic dial — crisp, ownable, unmistakable. The Ressence Type 3 (hand-less oil-filled disc display) is the avant-garde halo only when the vibe explicitly calls for radical futurism.

Match the requested vibe and price tier within this identity. Be specific and evocative; no clichés, no filler.`;

// Vibe → structured watch spec (the designer's brain).
export async function designWatch(vibe, refine = "") {
  const user = refine
    ? `VIBE / BRIEF: ${vibe}\n\nREVISE the design to address this critique while keeping what already works:\n${refine}`
    : `VIBE / BRIEF: ${vibe}`;
  const content = await chat(
    [{ role: "system", content: DESIGNER_SYSTEM }, { role: "user", content: user }],
    { maxTokens: 900, temperature: 0.7, schema: WATCH_SCHEMA }
  );
  return parseJSON(content, {});
}

// Spec → evocative, designer-grade image prompt (the same register as the
// hand-written A/B exemplars, but generated from the structured spec).
export function renderWatchPrompt(spec) {
  const c = spec.caseSpec || {};
  const d = spec.dial || {};
  const m = spec.markers || {};
  const h = spec.hands || {};
  const parts = [
    `Macro editorial product photograph of a brand-neutral ${spec.archetype || "watch"} — absolutely NO real brand, logo, crest, or text anywhere on the watch (blank dial, no wordmark).`,
    spec.designDNA && `Design language: ${spec.designDNA}.`,
    (c.diameterMm || c.shape) && `Proportions: ${[c.diameterMm && `${c.diameterMm}mm wide`, c.thicknessMm && `${c.thicknessMm}mm thin profile`, c.lugToLugMm && `${c.lugToLugMm}mm lug-to-lug`].filter(Boolean).join(", ")}; ${[c.shape, c.material, c.finishing].filter(Boolean).join(", ")}.`,
    spec.crystal && `${spec.crystal}.`,
    spec.bezel && `${spec.bezel}.`,
    (d.base || d.color) && `Dial: ${[d.color, d.base].filter(Boolean).join(" ")}${d.texture ? `, ${d.texture}` : ""}${d.openness ? `, ${d.openness}` : ""}.`,
    (m.style || m.material) && `Markers: ${[m.style, m.material, m.lume && m.lume !== "none" && `${m.lume} lume`].filter(Boolean).join(", ")}.`,
    (h.shape || h.finish) && `Hands: ${[h.shape, h.finish, h.lume && h.lume !== "none" && `${h.lume} lume`].filter(Boolean).join(", ")}.`,
    spec.movement && `Movement: ${spec.movement}.`,
    spec.complication && spec.complication.toLowerCase() !== "time-only" && `Complication: ${spec.complication}.`,
    spec.strap && `Strap: ${spec.strap}.`,
    spec.heroGesture && `THE HERO, make it the unmistakable focal point: ${spec.heroGesture}.`,
    spec.moodLighting && `Lighting & mood: ${spec.moodLighting}.`,
    spec.photoDirection && `${spec.photoDirection}.`,
    renderWatchRules(),
  ];
  return parts.filter(Boolean).join(" ");
}

// The create-verify loop around the designer: design → judge → critique → redesign.
// The judged artifact is the rendered prompt; the matching spec is returned too.
export async function designWatchIterated(vibe, { rounds = 2, threshold = 8 } = {}) {
  // generate is called once per round in order, so specsByRound[r-1] is round r's
  // spec — robust even if two rounds happen to render an identical prompt.
  const specsByRound = [];
  const generate = async ({ brief, fixes }) => {
    const refine = fixes && fixes.length ? fixes.join("; ") : "";
    const spec = await designWatch(brief, refine);
    specsByRound.push(spec);
    return renderWatchPrompt(spec);
  };
  const result = await iterate({ brief: vibe, rubric: getRubric("watch-design"), threshold, maxRounds: rounds, generate });
  return {
    vibe,
    spec: specsByRound[result.best.round - 1] || null,
    prompt: result.best.artifact,
    score: result.best.overall,
    reachedBar: result.reachedBar,
    rounds: result.rounds.map((r) => ({ round: r.round, score: r.overall, summary: r.summary })),
  };
}
