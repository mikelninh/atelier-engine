// Shared prompt builder for the runtime sneaker generator.
//
// The output is structured like a footwear tech-pack: a chosen last, its
// construction details, the upper material, and a colourway specified ZONE BY
// ZONE (the way a real shoe designer briefs a sample-room). Image models follow
// a labelled, zone-by-zone block far more reliably than flowing prose, so the
// same inputs produce the same sneaker every time.
//
// The studio still calls buildUserPrompt with the original four knobs
// ({ modelName, paletteName, materialName, aiMode }) plus themeId / refineNote.
// Those expand internally into the full zone spec. Power users / future UI can
// pass additive overrides: colorway (per-zone map), construction (per-field
// map), and render (angle / backdrop).

export const SYSTEM_PROMPT = `You are a product photographer for an editorial sneaker design house.

ABSOLUTE RULES — violating any one means the image is unusable:
- Brand-neutral generic silhouette. NO real-world brand logo of any kind.
- DO NOT draw an Adidas trefoil, three parallel side stripes, or Samba styling.
- DO NOT draw a Nike swoosh, Jumpman, or Air Max bubble.
- DO NOT draw a Puma formstrip, New Balance "N", Asics tiger stripes, Reebok vector,
  Converse star, or any Vans side stripe.
- DO NOT draw any text, lettering, numbers, tags, badges, or signature panels.
- The side panel must be plain — no stripes, no logos, no perforated brand patterns.
- No tongue label text. No heel tab text. No insole text.
- No watermarks, no signatures, no captions.

HOW TO READ THE BRIEF:
- The brief is a footwear spec sheet. Honour every labelled line exactly.
- The COLOURWAY block assigns one colour/finish to each named zone of the shoe.
  Apply each colour only to its zone. Do not bleed colours across zones, and do
  not invent colours for zones that are not listed.

AESTHETIC:
- Editorial product photography in the register of MUJI, Kinfolk, Cereal magazine.
- Calm, restrained, material-honest. Soft directional natural light from upper left.
- Neutral warm-cream studio backdrop with subtle floor shadow.
- High detail on stitching, leather grain, knit weave, mesh, and rubber sole texture.`;

// ── Silhouettes ────────────────────────────────────────────────────────────
// Each last declares its anatomy and which colour zones actually exist on it
// (a slip-on has no laces or eyestay — those zones are suppressed downstream).
const SILHOUETTES = {
  "Aeris Flow": {
    summary: "chunky lifestyle running sneaker — low-top, round toe, maximal sculpted volume",
    lacing: "6 pairs of blind eyelets, flat laces",
    midsole: "tall sculpted foam midsole with subtle horizontal ridges",
    outsole: "rubber traction pods",
    overlays: "layered mesh-and-synthetic overlays on the side panel",
    zones: ["base", "overlay", "toe", "eyestay", "tongue", "collar", "heelTab", "midsole", "outsole", "laces", "stitching"],
  },
  "Court Heritage": {
    summary: "low-top retro court sneaker — slim profile, round capped toe",
    lacing: "7 pairs of metal eyelets, flat waxed laces",
    midsole: "low-profile cup-sole",
    outsole: "gum rubber cup-sole with fine tread",
    overlays: "suede toe overlay and slim side overlay",
    zones: ["base", "overlay", "toe", "eyestay", "tongue", "collar", "heelTab", "midsole", "outsole", "laces", "stitching"],
  },
  "Future Slip": {
    summary: "futuristic comfort slip-on mule — sculptural single-piece silhouette, laceless",
    lacing: null,
    midsole: "thick single-piece foam midsole continuous with the upper",
    outsole: "soft foam outsole with shallow grip",
    overlays: null,
    zones: ["base", "toe", "collar", "heelTab", "midsole", "outsole", "stitching"],
  },
  "Trailforge X": {
    summary: "rugged performance trail runner — low-to-mid cut, protective toe, slim heel cup",
    lacing: "speed-lace system through webbing eyelets",
    midsole: "rockered EVA midsole",
    outsole: "aggressive deep-lugged outsole",
    overlays: "technical synthetic overlays and a protective mudguard",
    zones: ["base", "overlay", "toe", "eyestay", "tongue", "collar", "heelTab", "midsole", "outsole", "laces", "stitching"],
  },
};

// ── Upper materials ──────────────────────────────────────────────────────────
const MATERIALS = {
  "Pearl Knit": "adaptive knit upper with a subtle weave texture, matte finish",
  "Cloud Suede": "soft premium suede upper with a fine nap, matte finish",
  "Bio Leather": "plant-based leather upper with a smooth grain, satin finish",
  "Carbon Mesh": "performance carbon mesh upper with technical overlays, low-sheen finish",
};

// ── Colourways: one colour per anatomical zone ───────────────────────────────
// Canonical zone order (used to emit the COLOURWAY block in a stable order).
export const ZONE_ORDER = ["base", "overlay", "toe", "eyestay", "tongue", "collar", "heelTab", "midsole", "outsole", "laces", "stitching"];
export const ZONE_LABELS = {
  base: "base upper",
  overlay: "side overlays",
  toe: "toe cap",
  eyestay: "lace panel / eyestay",
  tongue: "tongue",
  collar: "collar",
  heelTab: "heel tab",
  midsole: "midsole",
  outsole: "outsole",
  laces: "laces",
  stitching: "stitching",
};

const COLORWAYS = {
  Moonstone: {
    base: "soft off-white pearl",
    overlay: "soft off-white pearl (tonal)",
    toe: "soft off-white pearl",
    eyestay: "soft off-white pearl",
    tongue: "off-white pearl with pale grey lining",
    collar: "off-white pearl",
    heelTab: "deep charcoal",
    midsole: "ivory",
    outsole: "ivory",
    laces: "pearl white",
    stitching: "deep charcoal, subtle contrast",
  },
  "Forest Gum": {
    base: "deep forest green",
    overlay: "tan suede",
    toe: "tan suede",
    eyestay: "deep forest green",
    tongue: "deep forest green with cream lining",
    collar: "deep forest green",
    heelTab: "tan leather",
    midsole: "cream foam",
    outsole: "gum amber rubber",
    laces: "off-white waxed",
    stitching: "tonal green",
  },
  "Sand Future": {
    base: "warm sand-beige",
    overlay: "soft cocoa brown",
    toe: "soft cocoa brown",
    eyestay: "warm sand-beige",
    tongue: "warm sand-beige",
    collar: "warm sand-beige with cocoa lining",
    heelTab: "soft cocoa brown",
    midsole: "dark charcoal foam",
    outsole: "dark charcoal",
    laces: "sand-beige",
    stitching: "cocoa, tonal",
  },
  "Cobalt Trail": {
    base: "matte obsidian black",
    overlay: "matte black with cobalt blue trim",
    toe: "matte obsidian black",
    eyestay: "matte obsidian black",
    tongue: "matte black with cobalt pull",
    collar: "matte obsidian black",
    heelTab: "cobalt blue",
    midsole: "dark slate grey",
    outsole: "dark slate grey",
    laces: "black",
    stitching: "cobalt blue accent",
  },
};

const STYLE_BLURBS = {
  "Luxury Minimalist": "Quiet luxury, restrained, minimal detailing.",
  "Street Ritual": "Laid-back streetwear, slightly worn-in patina, casual stance.",
  "Performance Beast": "Technical, aggressive stance, performance-grade detailing.",
  "Collector Grail": "Rare-grail aesthetic, refined, museum-quality lighting.",
};

// THEMES — generic aesthetic descriptors that *evoke* the worlds of major
// franchises without naming or copying any protected element. Each theme is a
// pure colour-and-material direction; the prompt never references the
// franchise itself, and no logo/character is allowed (the SYSTEM_PROMPT's
// brand-neutral rules still apply).
//
// These power the studio's "Theme Inspiration" picker and become the basis
// for future *licensed* collaborations (where the franchise name and assets
// can legally appear, behind a deal).
export const THEMES = [
  { id: "none",            label: "No theme",            inspiredBy: null,                       hint: "" },
  { id: "electric-champ",  label: "Electric Champion",   inspiredBy: "creature-battle franchises", hint: "Bright lemon-yellow upper, sharp jet-black accents on heel and tongue, lightning-bolt stitching on the side panel, glossy finish." },
  { id: "forest-spirit",   label: "Forest Spirit",       inspiredBy: "Studio Ghibli forests",     hint: "Soft moss-green upper, warm earth-tone leather accents, hand-drawn weathered patina, slightly fuzzy nap, organic stitching." },
  { id: "theme-park",      label: "Theme Park Heritage", inspiredBy: "vintage theme-park mascots", hint: "Nostalgic cream upper with bold cherry-red accents, polished round details, playful slightly-cartoon proportions, cream sole." },
  { id: "galactic-knight", label: "Galactic Knight",     inspiredBy: "space opera trooper armour", hint: "Matte white plate-like overlays segmented across the upper, deep black side-panel inset like a visor, satin finish, dark grey sole." },
  { id: "stitched-hero",   label: "Stitched Hero",       inspiredBy: "comic-book superhero suits", hint: "Bold crimson-red leather upper, deep navy panels, fine web-style stitching pattern across the side panel, polished black sole." },
  { id: "scroll-master",   label: "Scroll Master",       inspiredBy: "shinobi anime",             hint: "Warm orange upper, deep black accents on tongue and heel, scroll-style stitching, matte black rope-like laces." },
  { id: "sky-pirate",      label: "Sky Pirate",          inspiredBy: "swashbuckling sea-pirate epics", hint: "Distressed cherry-red leather upper, antique brass eyelets, natural straw-rope laces, weathered tan sole." },
  { id: "dragon-scale",    label: "Dragon Scale",        inspiredBy: "viking dragon-rider tales", hint: "Deep midnight-blue upper with iridescent scale-pattern overlay across the side panel, bone-white sole, leather pull tab on heel." },
  { id: "ancients-forge",  label: "Forge of the Ancients", inspiredBy: "high-fantasy epics",      hint: "Bronze-toned leather upper, antiqued brass eyelets, rune-style decorative stitching, deep umber sole." },
  { id: "bath-house",      label: "Bath House Dream",    inspiredBy: "dreamlike Ghibli baths",    hint: "Soft pastel pink and lilac panels with cream accents, gentle dreamlike palette, light steam-soft texture, ivory sole." },
  { id: "demon-hunter",    label: "Demon Hunter",        inspiredBy: "demon-slaying anime",       hint: "Dark forest-green with subtle black checkered pattern across the side panel like a haori, polished silver eyelets, blade-grey sole." },
  { id: "field-recon",     label: "Field Recon",         inspiredBy: "military scouting anime",   hint: "Olive drab green upper, brown leather harness-style overlays with brass buckles, distressed canvas tongue, dark khaki sole." },
];

export function findTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

// ── Render direction ─────────────────────────────────────────────────────────
const RENDER_ANGLES = {
  "three-quarter": "three-quarter front lateral angle, single sneaker",
  lateral: "full lateral profile, single sneaker",
  hero: "elevated hero angle, single sneaker",
};
const DEFAULT_RENDER = {
  angle: "three-quarter",
  backdrop: "warm-cream studio backdrop",
};
function buildRenderLine(render) {
  const r = { ...DEFAULT_RENDER, ...(render || {}) };
  const angle = RENDER_ANGLES[r.angle] || RENDER_ANGLES["three-quarter"];
  return `RENDER: studio product photography, ${angle}, soft directional natural light from upper left, ${r.backdrop}, gentle ground shadow, 1:1 square crop, high resolution, editorial. Realistic footwear proportions, undistorted symmetric sole, no warped toe box, no extra or mismatched eyelets, no random surface patterns.`;
}

export function getSilhouette(name) {
  return SILHOUETTES[name] || SILHOUETTES["Court Heritage"];
}
export function getColorway(name) {
  return COLORWAYS[name] || COLORWAYS.Moonstone;
}

// Build the labelled, zone-by-zone footwear spec. Construction lines that don't
// apply to a silhouette (e.g. lacing on a slip-on) and colour zones the last
// doesn't have are suppressed, so the prompt stays terse (~15–20 lines).
export function buildUserPrompt({
  modelName,
  paletteName,
  materialName,
  aiMode,
  themeId,
  refineNote,
  signatureFeature,
  colorway: colorwayOverride,
  construction,
  render,
} = {}) {
  const sil = { ...getSilhouette(modelName), ...(construction || {}) };
  const colors = { ...getColorway(paletteName), ...(colorwayOverride || {}) };
  const material = MATERIALS[materialName] || "leather upper, matte finish";
  const style = STYLE_BLURBS[aiMode] || "";
  const theme = themeId ? findTheme(themeId) : null;

  const lines = [];
  lines.push(`SILHOUETTE: ${sil.summary}.`);
  if (sil.lacing) lines.push(`LACING: ${sil.lacing}.`);
  lines.push(`MIDSOLE: ${sil.midsole}.`);
  lines.push(`OUTSOLE: ${sil.outsole}.`);
  if (sil.overlays) lines.push(`OVERLAYS: ${sil.overlays}.`);
  lines.push(`UPPER MATERIAL: ${material}.`);

  const zoneLines = sil.zones
    .filter((z) => colors[z])
    .map((z) => `- ${ZONE_LABELS[z]}: ${colors[z]}`);
  // Stable ordering even if a silhouette lists zones out of canonical order.
  zoneLines.sort((a, b) => {
    const za = ZONE_ORDER.findIndex((z) => a.startsWith(`- ${ZONE_LABELS[z]}:`));
    const zb = ZONE_ORDER.findIndex((z) => b.startsWith(`- ${ZONE_LABELS[z]}:`));
    return za - zb;
  });
  lines.push("COLOURWAY (apply each colour only to its named zone):");
  lines.push(...zoneLines);

  if (signatureFeature && signatureFeature.trim()) {
    lines.push(`SIGNATURE DETAIL (the single iconic feature — make it the focal point, keep everything else restrained): ${signatureFeature.trim()}`);
  }
  if (style) lines.push(`MOOD: ${style}`);
  if (theme && theme.hint) lines.push(`THEME DIRECTION: ${theme.hint}`);
  if (refineNote && refineNote.trim()) lines.push(`CREATOR NOTE: ${refineNote.trim()}`);

  lines.push("");
  lines.push(buildRenderLine(render));

  return lines.join("\n");
}
