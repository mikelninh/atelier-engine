// SATORI — the brand (working name).
//
// The catalogue is intentionally narrow: ONE base SKU, a handful of modular
// add-ons per group, each carrying a price delta and the prompt fragment that
// renders that option. "Constrained freedom" — the Apple/MacBook pattern: a
// strong base, a small ladder of premium upgrades, transparent pricing.
//
// assemblePrompt(selection) builds the final image prompt from the locked
// brand photography recipe plus the selected option fragments. The same recipe
// runs across the whole collection so the catalogue reads as one coherent
// drop, not a generic catch-all.

export const BRAND = {
  name: "SATORI",
  tagline: "Built to be inherited.",
  basePriceEur: 399,
  baseModelName: "Satori Origin",
};

// Each option: { id, label, delta (€), prompt (fragment), tone (hex swatch),
// note? (small subline). The first option in each group is the base default. }
export const CONFIG_GROUPS = [
  {
    id: "case",
    label: "Case",
    helper: "316L steel base. Coated or titanium upgrades.",
    options: [
      { id: "steel",    label: "Brushed Steel",  delta: 0,   tone: "#c2c7cc", note: "316L · base",          prompt: "brushed 316L stainless steel case with mirror-polished chamfered bevels" },
      { id: "blackpvd", label: "Stealth Black",  delta: 80,  tone: "#1c1d1f", note: "matte PVD coating",    prompt: "matte black PVD-coated steel case with subtly polished chamfers" },
      { id: "titanium", label: "Grade-5 Titanium",delta: 130, tone: "#8a8d92", note: "lighter, hypoallergenic", prompt: "sandblasted grade-5 titanium case in warm grey with mirror-polished chamfers" },
    ],
  },
  {
    id: "dial",
    label: "Dial",
    helper: "The dial is the brand's signature.",
    options: [
      { id: "guilloche", label: "Midnight Guilloché",  delta: 0,   tone: "#1a2e57", note: "fine waffle guilloché · base", prompt: "deep midnight-blue fine waffle guilloché dial with a small pyramidal pattern catching the light" },
      { id: "templeblack",label: "Temple Circuit",      delta: 90,  tone: "#16171a", note: "engraved mandala",         prompt: "matte black dial with a fine engraved 'temple-circuit' mandala pattern catching light" },
      { id: "meteorite",  label: "Meteorite",           delta: 120, tone: "#b6b9bd", note: "Gibeon · natural lattice",  prompt: "genuine Gibeon meteorite dial showing its natural crystalline Widmanstätten lattice, cool silver-grey" },
      { id: "aventurine", label: "Midnight Aventurine", delta: 180, tone: "#0e1638", note: "cosmic starfield",          prompt: "deep midnight-blue aventurine dial, a glittering cosmic starfield of gold flecks" },
    ],
  },
  {
    id: "strap",
    label: "Strap",
    helper: "Integrated bracelet, or strap downgrade.",
    options: [
      { id: "bracelet", label: "Integrated Bracelet", delta: 0,   tone: "#c2c7cc", note: "case-matched · base", prompt: "tapered integrated metal bracelet flowing seamlessly from the case in the same finish as the case" },
      { id: "rubber",   label: "Tropic Rubber",       delta: -40, tone: "#15151a", note: "lightweight",         prompt: "black tropic-style perforated rubber strap with a brushed deployant clasp" },
      { id: "leather",  label: "Aged Leather",        delta: -30, tone: "#6b3f24", note: "warm patina",         prompt: "warm cognac aged-leather strap with cream stitching and a brushed deployant clasp" },
    ],
  },
  {
    id: "engraving",
    label: "Caseback engraving",
    helper: "A short intention etched on the caseback.",
    options: [
      { id: "none",      label: "None",              delta: 0,  tone: "#ece5d7", note: "blank caseback" },
      { id: "intention", label: "Custom intention",  delta: 40, tone: "#191714", note: "up to 28 characters" },
    ],
  },
  {
    id: "movement",
    label: "Movement",
    helper: "All automatic. Premium tier upgrades the calibre.",
    options: [
      { id: "standard", label: "Automatic · standard", delta: 0,   tone: "#c2c7cc", note: "Miyota / NH35-class" },
      { id: "premium",  label: "Automatic · premium",  delta: 200, tone: "#c9a95b", note: "decorated calibre, exhibition caseback" },
    ],
  },
];

export const DEFAULT_SELECTION = Object.fromEntries(
  CONFIG_GROUPS.map((g) => [g.id, g.options[0].id])
);

export function getOption(groupId, optionId) {
  const g = CONFIG_GROUPS.find((x) => x.id === groupId);
  return g?.options.find((o) => o.id === optionId) || g?.options[0];
}

export function totalEur(selection) {
  return CONFIG_GROUPS.reduce((sum, g) => sum + (getOption(g.id, selection[g.id])?.delta || 0), BRAND.basePriceEur);
}

// Pre-rendered, MJ-quality variant photography. Keyed by case|dial|strap.
// When a key exists, the configurator swaps to it instantly (Apple pattern).
// Drop new variant PNGs into /public/watches/satori/ and add the key here.
export const COMBO_IMAGES = {
  "steel|meteorite|bracelet":         "/watches/satori/steel-meteorite-bracelet.png",
  "steel|aventurine|bracelet":        "/watches/satori/steel-aventurine-bracelet.png",
  "steel|templeblack|bracelet":       "/watches/satori/steel-templeblack-bracelet.png",
  "blackpvd|templeblack|bracelet":    "/watches/satori/blackpvd-templeblack-bracelet.png",
  "blackpvd|guilloche|bracelet":      "/watches/satori/blackpvd-guilloche-bracelet.png",
  "blackpvd|aventurine|bracelet":     "/watches/satori/blackpvd-aventurine-bracelet.png",
  "titanium|meteorite|bracelet":      "/watches/satori/titanium-meteorite-bracelet.png",
  "titanium|guilloche|rubber":        "/watches/satori/titanium-guilloche-rubber.png",
};

export function bakedImage(selection) {
  return COMBO_IMAGES[`${selection.case}|${selection.dial}|${selection.strap}`] || null;
}

// Specs derived from the selection — drives the "Tech Specs" accordion.
export function buildSpecs(selection) {
  const c = getOption("case", selection.case);
  const m = getOption("movement", selection.movement);
  return [
    { label: "Case",          value: `${c.label} · 41mm · softened octagonal bezel with 8 exposed screws` },
    { label: "Thickness",     value: "9.0 mm" },
    { label: "Crystal",       value: "Domed sapphire, anti-reflective inner coat" },
    { label: "Water resistance", value: "50 m" },
    { label: "Movement",      value: m.label.replace("Automatic · ", "Automatic ") + ` · ${m.note}` },
    { label: "Power reserve", value: m.id === "premium" ? "70 hours" : "40 hours" },
    { label: "Warranty",      value: "2 years international · lifetime service" },
    { label: "Production",    value: "Limited drop · made-to-order in 8–12 weeks" },
  ];
}


// One locked photography recipe so every configuration belongs to the same
// brand visually. SATORI's own silhouette — NOT a Royal Oak homage. The
// distinctive language: a soft hexagonal bezel (six sides as a sacred-geometry
// / mandala reference), COMPLETELY SMOOTH AND SCREWLESS (no exposed bolts, no
// hex screws), with brushed tops meeting mirror-polished chamfered edges where
// the hexagon facets join. Integrated tapered bracelet flowing from the case
// without separate lugs. Ultra-thin profile, broad open dial.
const PHOTO = "Crisp macro product photograph of an editorial luxury sports watch with a DISTINCTIVE SOFT-HEXAGON silhouette unique to this house — six-sided bezel with gently rounded vertices, COMPLETELY SMOOTH AND SCREWLESS (absolutely no exposed screws, no bolts, no hex screws on the bezel), with brushed top surfaces meeting mirror-polished chamfered edges where the hexagon facets join. Tapered integrated bracelet (or strap) flowing seamlessly from the case with no separate lugs, ultra-thin ~9mm profile, broad open dial as the hero. Blank dial — absolutely no text, no logo, no wordmark, no numerals. Applied faceted polished baton markers, sword hands. Exactly one knurled crown at 3 o'clock and no duplicate crowns or pushers. Dramatic single-source side light, deep blacks, jewel-like reflections on the polished chamfers, dark volcanic-stone backdrop, shallow depth of field, ultra-premium catalogue realism. Perfectly symmetric six-sided case, undistorted dial. Not a Royal Oak, not octagonal, no exposed screws.";

export function assemblePrompt(selection) {
  const c = getOption("case", selection.case);
  const d = getOption("dial", selection.dial);
  const s = getOption("strap", selection.strap);
  return `${PHOTO} CASE: ${c.prompt}. DIAL: ${d.prompt}. STRAP: ${s.prompt}.`;
}
