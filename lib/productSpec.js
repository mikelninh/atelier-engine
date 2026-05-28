// Product-agnostic spec engine.
//
// The engine is not a sneaker generator — it is a "labelled tech-pack → image"
// generator. A PRODUCT TYPE declares its anatomy (silhouettes + the colour
// zones each silhouette has), its construction fields, its materials, named
// colourways, render angles, and the brand-neutrality rules its image model
// must obey. buildUserPrompt() reads a type and emits the same kind of terse,
// labelled spec sheet a sample room is briefed with — image models follow a
// labelled, zone-by-zone block far more reliably than prose.
//
// Three types ship today: sneaker, watch, trikot. Adding a fourth is pure data.
//
// THEMES are shared across all types (a colour/material direction that evokes a
// franchise without naming it). Each theme carries a per-type `hints` map so a
// "Forest Spirit" reads as moss-green suede on a sneaker, moss-green dial on a
// watch, and a moss-green kit on a jersey — never sneaker anatomy leaking onto
// a watch.
//
// buildMatchingSetPrompt() composes several pieces into ONE editorial flat-lay
// that share a palette — the "matching sneaker + trikot in one prompt" payoff.

// ── Shared themes ────────────────────────────────────────────────────────────
// Generic aesthetic directions that *evoke* major franchises without naming or
// copying any protected element. Pure colour/material; the brand-neutral rules
// in every type's SYSTEM_PROMPT still apply. `hints.sneaker` keeps the original
// sneaker phrasing; `hints.default` is an anatomy-free palette used by any other
// type (and as a fallback).
export const THEMES = [
  { id: "none",            label: "No theme",            inspiredBy: null,                         hints: {} },
  { id: "electric-champ",  label: "Electric Champion",   inspiredBy: "creature-battle franchises",  hints: { sneaker: "Bright lemon-yellow upper, sharp jet-black accents on heel and tongue, lightning-bolt stitching on the side panel, glossy finish.", default: "Bright lemon-yellow with sharp jet-black accents, glossy finish." } },
  { id: "forest-spirit",   label: "Forest Spirit",       inspiredBy: "Studio Ghibli forests",       hints: { sneaker: "Soft moss-green upper, warm earth-tone leather accents, hand-drawn weathered patina, slightly fuzzy nap, organic stitching.", default: "Soft moss-green with warm earth-tone accents, weathered organic patina, slightly fuzzy matte texture." } },
  { id: "theme-park",      label: "Theme Park Heritage", inspiredBy: "vintage theme-park mascots",  hints: { sneaker: "Nostalgic cream upper with bold cherry-red accents, polished round details, playful slightly-cartoon proportions, cream sole.", default: "Nostalgic cream with bold cherry-red accents, polished details, playful proportions." } },
  { id: "galactic-knight", label: "Galactic Knight",     inspiredBy: "space opera trooper armour",  hints: { sneaker: "Matte white plate-like overlays segmented across the upper, deep black side-panel inset like a visor, satin finish, dark grey sole.", default: "Matte white plate-like surfaces with deep black inset panels, satin finish, dark grey accents." } },
  { id: "stitched-hero",   label: "Stitched Hero",       inspiredBy: "comic-book superhero suits",  hints: { sneaker: "Bold crimson-red leather upper, deep navy panels, fine web-style stitching pattern across the side panel, polished black sole.", default: "Bold crimson-red with deep navy panels, fine web-pattern detailing, polished black accents." } },
  { id: "scroll-master",   label: "Scroll Master",       inspiredBy: "shinobi anime",               hints: { sneaker: "Warm orange upper, deep black accents on tongue and heel, scroll-style stitching, matte black rope-like laces.", default: "Warm orange with deep black accents, matte black detailing." } },
  { id: "sky-pirate",      label: "Sky Pirate",          inspiredBy: "swashbuckling sea-pirate epics", hints: { sneaker: "Distressed cherry-red leather upper, antique brass eyelets, natural straw-rope laces, weathered tan sole.", default: "Distressed cherry-red leather tones, antique brass hardware, natural straw-rope detailing, weathered tan finish." } },
  { id: "dragon-scale",    label: "Dragon Scale",        inspiredBy: "viking dragon-rider tales",   hints: { sneaker: "Deep midnight-blue upper with iridescent scale-pattern overlay across the side panel, bone-white sole, leather pull tab on heel.", default: "Deep midnight-blue with iridescent scale-pattern detailing, bone-white accents." } },
  { id: "ancients-forge",  label: "Forge of the Ancients", inspiredBy: "high-fantasy epics",        hints: { sneaker: "Bronze-toned leather upper, antiqued brass eyelets, rune-style decorative stitching, deep umber sole.", default: "Bronze-toned with antiqued brass hardware, rune-style decorative detailing, deep umber finish." } },
  { id: "bath-house",      label: "Bath House Dream",    inspiredBy: "dreamlike Ghibli baths",      hints: { sneaker: "Soft pastel pink and lilac panels with cream accents, gentle dreamlike palette, light steam-soft texture, ivory sole.", default: "Soft pastel pink and lilac with cream accents, dreamlike palette, steam-soft texture, ivory finish." } },
  { id: "demon-hunter",    label: "Demon Hunter",        inspiredBy: "demon-slaying anime",         hints: { sneaker: "Dark forest-green with subtle black checkered pattern across the side panel like a haori, polished silver eyelets, blade-grey sole.", default: "Dark forest-green with a subtle black checkered pattern, polished silver hardware, blade-grey accents." } },
  { id: "field-recon",     label: "Field Recon",         inspiredBy: "military scouting anime",     hints: { sneaker: "Olive drab green upper, brown leather harness-style overlays with brass buckles, distressed canvas tongue, dark khaki sole.", default: "Olive-drab green with brown leather harness-tone overlays, brass hardware, distressed canvas, dark khaki finish." } },
];

function findThemeRaw(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

// ── Product types ─────────────────────────────────────────────────────────────
export const PRODUCT_TYPES = {
  // ════════════════════════════════════ SNEAKER ════════════════════════════════
  sneaker: {
    id: "sneaker",
    label: "Sneaker",
    systemPrompt: `You are a product photographer for an editorial sneaker design house.

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
- High detail on stitching, leather grain, knit weave, mesh, and rubber sole texture.`,
    specFields: [
      { key: "summary", label: "SILHOUETTE" },
      { key: "lacing", label: "LACING" },
      { key: "midsole", label: "MIDSOLE" },
      { key: "outsole", label: "OUTSOLE" },
      { key: "overlays", label: "OVERLAYS" },
    ],
    materialLabel: "UPPER MATERIAL",
    materialFallback: "leather upper, matte finish",
    materials: {
      "Pearl Knit": "adaptive knit upper with a subtle weave texture, matte finish",
      "Cloud Suede": "soft premium suede upper with a fine nap, matte finish",
      "Bio Leather": "plant-based leather upper with a smooth grain, satin finish",
      "Carbon Mesh": "performance carbon mesh upper with technical overlays, low-sheen finish",
    },
    zoneOrder: ["base", "overlay", "toe", "eyestay", "tongue", "collar", "heelTab", "midsole", "outsole", "laces", "stitching"],
    zoneLabels: {
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
    },
    defaultSilhouette: "Court Heritage",
    silhouettes: {
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
    },
    defaultColorway: "Moonstone",
    colorways: {
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
    },
    styleBlurbs: {
      "Luxury Minimalist": "Quiet luxury, restrained, minimal detailing.",
      "Street Ritual": "Laid-back streetwear, slightly worn-in patina, casual stance.",
      "Performance Beast": "Technical, aggressive stance, performance-grade detailing.",
      "Collector Grail": "Rare-grail aesthetic, refined, museum-quality lighting.",
    },
    renderAngles: {
      "three-quarter": "three-quarter front lateral angle, single sneaker",
      lateral: "full lateral profile, single sneaker",
      hero: "elevated hero angle, single sneaker",
    },
    defaultRender: { angle: "three-quarter", backdrop: "warm-cream studio backdrop" },
    renderRules: "Realistic footwear proportions, undistorted symmetric sole, no warped toe box, no extra or mismatched eyelets, no random surface patterns.",
  },

  // ═════════════════════════════════════ WATCH ═════════════════════════════════
  watch: {
    id: "watch",
    label: "Watch",
    systemPrompt: `You are a product photographer for an editorial watch atelier.

ABSOLUTE RULES — violating any one means the image is unusable:
- Brand-neutral generic timepiece. NO real-world watch brand logo, crest, or name.
- DO NOT draw a Rolex coronet, Omega symbol, Patek Philippe Calatrava cross,
  Audemars Piguet "AP", TAG Heuer shield, or any Seiko/Casio/Swatch wordmark.
- Print NO brand name, model name, or text on the dial, case back, crown, or clasp.
- The dial carries NO wordmark and NO logo — only the indices, hands, and any
  complication named in the brief.
- No applied logos, no engraved signatures, no date-window branding, no watermarks,
  no captions.

HOW TO READ THE BRIEF:
- The brief is a watch spec sheet. Honour every labelled line exactly.
- The COLOURWAY block assigns one colour/finish to each named part of the watch.
  Apply each colour only to its part. Do not bleed finishes across parts, and do
  not invent parts that are not listed.

AESTHETIC:
- Editorial product photography in the register of MUJI, Kinfolk, Cereal magazine.
- Calm, restrained, material-honest. Soft directional natural light from upper left.
- Neutral warm-cream studio surface with a soft reflection.
- High detail on brushed and polished metal, sapphire reflections, dial texture,
  lume, and strap grain.`,
    specFields: [
      { key: "summary", label: "CASE & SILHOUETTE" },
      { key: "movement", label: "MOVEMENT" },
      { key: "bezel", label: "BEZEL" },
      { key: "crystal", label: "CRYSTAL" },
      { key: "complications", label: "COMPLICATIONS" },
      { key: "strap", label: "STRAP" },
    ],
    materialLabel: "CASE MATERIAL",
    materialFallback: "brushed stainless steel case, matte finish",
    materials: {
      "Brushed Steel": "brushed 316L stainless steel case, matte finish",
      "Polished Gold": "polished gold-tone case, warm mirror finish",
      "Matte Titanium": "sandblasted titanium case, low-sheen grey finish",
      "Black PVD": "matte black PVD-coated steel case",
    },
    zoneOrder: ["case", "bezel", "dial", "subdial", "indices", "hands", "secondHand", "crown", "strap", "keeper", "stitching"],
    zoneLabels: {
      case: "case",
      bezel: "bezel",
      dial: "dial",
      subdial: "sub-dials",
      indices: "hour markers / indices",
      hands: "hour & minute hands",
      secondHand: "seconds hand",
      crown: "crown",
      strap: "strap / bracelet",
      keeper: "strap keeper",
      stitching: "strap stitching",
    },
    defaultSilhouette: "Field Classic",
    silhouettes: {
      "Field Classic": {
        summary: "utilitarian field watch — 38mm round case, clean legible dial, fixed bezel",
        movement: "automatic three-hand",
        bezel: "slim fixed polished bezel",
        crystal: "domed sapphire crystal",
        complications: "date window at 3 o'clock",
        strap: "two-piece leather strap",
        zones: ["case", "bezel", "dial", "indices", "hands", "secondHand", "crown", "strap", "keeper", "stitching"],
      },
      "Diver Pro": {
        summary: "dive watch — 42mm round case, unidirectional rotating bezel, high water resistance",
        movement: "automatic three-hand",
        bezel: "unidirectional rotating bezel with a 60-minute scale",
        crystal: "flat sapphire crystal",
        complications: "date window and screw-down crown",
        strap: "brushed steel link bracelet",
        zones: ["case", "bezel", "dial", "indices", "hands", "secondHand", "crown", "strap", "keeper", "stitching"],
      },
      "Dress Slim": {
        summary: "ultra-thin dress watch — 39mm round case, minimalist clean dial, no bezel",
        movement: "slim automatic two-hand",
        bezel: null,
        crystal: "flat sapphire crystal",
        complications: null,
        strap: "slim two-piece leather strap",
        zones: ["case", "dial", "indices", "hands", "crown", "strap", "keeper", "stitching"],
      },
      "Chrono Sport": {
        summary: "chronograph sports watch — 41mm round case, three sub-dials, tachymeter bezel",
        movement: "mechanical chronograph",
        bezel: "fixed tachymeter bezel",
        crystal: "domed sapphire crystal",
        complications: "three sub-dials and a date window",
        strap: "perforated leather racing strap",
        zones: ["case", "bezel", "dial", "subdial", "indices", "hands", "secondHand", "crown", "strap", "keeper", "stitching"],
      },
    },
    defaultColorway: "Slate Diver",
    colorways: {
      "Slate Diver": {
        case: "brushed steel",
        bezel: "matte black",
        dial: "deep slate-grey sunburst",
        indices: "luminous cream",
        hands: "polished steel with lume fill",
        secondHand: "burnt orange",
        crown: "brushed steel",
        strap: "brushed steel bracelet",
        keeper: "brushed steel",
        stitching: "none",
      },
      "Cream Field": {
        case: "brushed steel",
        dial: "warm cream",
        indices: "black printed numerals",
        hands: "blued steel",
        secondHand: "blued steel",
        crown: "brushed steel",
        strap: "tan leather",
        keeper: "tan leather",
        stitching: "tonal cream",
      },
      "Noir Dress": {
        case: "polished gold-tone",
        dial: "matte black",
        indices: "thin gold baton markers",
        hands: "gold dauphine",
        crown: "gold-tone",
        strap: "black leather",
        keeper: "black leather",
        stitching: "tonal black",
      },
      "Panda Chrono": {
        case: "brushed steel",
        bezel: "polished steel tachymeter",
        dial: "off-white",
        subdial: "matte black",
        indices: "black baton markers",
        hands: "black",
        secondHand: "black",
        crown: "brushed steel",
        strap: "black perforated leather",
        keeper: "black leather",
        stitching: "off-white contrast",
      },
    },
    styleBlurbs: {
      "Luxury Minimalist": "Quiet luxury, restrained dial, minimal complications.",
      "Street Ritual": "Casual everyday wrist presence, slightly rugged, worn-in strap.",
      "Performance Beast": "Tool-watch, high legibility, performance-grade bezel and lume.",
      "Collector Grail": "Rare-grail horology, refined finishing, museum-quality lighting.",
    },
    renderAngles: {
      "three-quarter": "three-quarter angle, single watch, crown at 3 o'clock, dial clearly legible",
      top: "top-down flat angle, single watch, full dial visible",
      macro: "macro detail, single watch, raking light across the dial",
    },
    defaultRender: { angle: "three-quarter", backdrop: "warm-cream studio surface" },
    renderRules: "Symmetric true-to-shape case, hands centred on the pinion, evenly spaced markers in the correct count, legible undistorted dial, no extra crowns or duplicated sub-dials, no brand text.",
  },

  // ═════════════════════════════════════ TRIKOT ════════════════════════════════
  trikot: {
    id: "trikot",
    label: "Trikot",
    systemPrompt: `You are a product photographer for an editorial sports-kit atelier.

ABSOLUTE RULES — violating any one means the image is unusable:
- Brand-neutral generic jersey. NO real-world club crest, national badge, or
  kit-maker logo.
- DO NOT draw a Nike swoosh, Adidas three stripes, Puma formstrip, or any
  kit-maker mark.
- DO NOT draw any real club crest, league patch, or sponsor wordmark.
- Print NO text, sponsor block, player name, or number unless the brief
  explicitly specifies it.
- No team name, no league logo, no manufacturer logo, no watermarks, no captions.

HOW TO READ THE BRIEF:
- The brief is a jersey/kit spec sheet. Honour every labelled line exactly.
- The COLOURWAY block assigns one colour/finish to each named panel of the jersey.
  Apply each colour only to its panel. Do not bleed colours across panels, and do
  not invent panels that are not listed.

AESTHETIC:
- Editorial product photography in the register of MUJI, Kinfolk, Cereal magazine.
- Clean ghost-mannequin or flat-lay presentation. Soft directional natural light
  from upper left.
- Neutral warm-cream studio backdrop with a soft shadow.
- High detail on fabric weave, mesh ventilation panels, stitched seams, and
  collar construction.`,
    specFields: [
      { key: "summary", label: "CUT & SILHOUETTE" },
      { key: "collar", label: "COLLAR" },
      { key: "sleeve", label: "SLEEVES" },
      { key: "fit", label: "FIT" },
      { key: "panels", label: "PANELS" },
    ],
    materialLabel: "FABRIC",
    materialFallback: "lightweight recycled polyester knit, matte finish",
    materials: {
      "Recycled Poly": "lightweight recycled polyester knit, moisture-wicking matte finish",
      "Aero Mesh": "engineered aero mesh with ventilation zones, low-sheen finish",
      "Cotton Heritage": "heavyweight cotton-poly blend, soft matte vintage finish",
      "Compression Knit": "four-way-stretch compression knit, smooth satin finish",
    },
    zoneOrder: ["body", "sleeves", "collar", "sidePanels", "shoulderYoke", "sponsorBlock", "numberArea", "trim", "hem", "stitching"],
    zoneLabels: {
      body: "body / torso",
      sleeves: "sleeves",
      collar: "collar",
      sidePanels: "side panels",
      shoulderYoke: "shoulder yoke",
      sponsorBlock: "sponsor block area",
      numberArea: "number area",
      trim: "trim / piping",
      hem: "hem",
      stitching: "stitching",
    },
    defaultSilhouette: "Pro Match",
    silhouettes: {
      "Pro Match": {
        summary: "pro-fit football jersey — athletic slim cut, short raglan sleeves",
        collar: "V-neck rib collar",
        sleeve: "short raglan sleeves with elastic cuffs",
        fit: "athletic slim match fit",
        panels: "laser-cut mesh ventilation side panels",
        zones: ["body", "sleeves", "collar", "sidePanels", "trim", "hem", "stitching"],
      },
      "Retro Terrace": {
        summary: "1990s retro football shirt — loose boxy cut",
        collar: "classic ribbed polo collar with buttons",
        sleeve: "loose short sleeves with contrast cuffs",
        fit: "relaxed boxy vintage fit",
        panels: "solid woven body, no mesh",
        zones: ["body", "sleeves", "collar", "trim", "hem", "stitching"],
      },
      "Cycling Aero": {
        summary: "aero cycling jersey — race fit, full-length front zip",
        collar: "low stand-up collar",
        sleeve: "long aero sleeves with gripper cuffs",
        fit: "compression race fit",
        panels: "mesh underarm panels and a silicone gripper hem",
        zones: ["body", "sleeves", "collar", "sidePanels", "trim", "hem", "stitching"],
      },
      "Basketball Tank": {
        summary: "basketball jersey — sleeveless tank, wide drop armholes",
        collar: "wide V-neck rib",
        sleeve: null,
        fit: "loose drop-armhole cut",
        panels: "contrast side inserts",
        zones: ["body", "collar", "sidePanels", "trim", "hem", "stitching"],
      },
    },
    defaultColorway: "Home Classic",
    colorways: {
      "Home Classic": {
        body: "deep royal blue",
        sleeves: "deep royal blue",
        collar: "white rib",
        sidePanels: "white mesh",
        trim: "white piping",
        hem: "white",
        stitching: "tonal blue",
      },
      "Away Mono": {
        body: "off-white",
        sleeves: "off-white",
        collar: "charcoal rib",
        sidePanels: "light grey mesh",
        trim: "charcoal",
        hem: "charcoal",
        stitching: "tonal cream",
      },
      "Forest Kit": {
        body: "deep forest green",
        sleeves: "deep forest green",
        collar: "cream rib",
        sidePanels: "tan",
        trim: "tan piping",
        hem: "cream",
        stitching: "tonal green",
      },
      "Crimson Aero": {
        body: "crimson red",
        sleeves: "crimson red",
        collar: "black stand collar",
        sidePanels: "black mesh",
        trim: "black",
        hem: "black silicone gripper",
        stitching: "tonal red",
      },
    },
    styleBlurbs: {
      "Luxury Minimalist": "Quiet, tonal, minimal trim — a lifestyle-grade kit.",
      "Street Ritual": "Street-football energy, bold blocking, worn-in terrace vibe.",
      "Performance Beast": "Pro-grade performance kit, engineered ventilation, aggressive paneling.",
      "Collector Grail": "Rare collector kit, refined retro detailing, museum lighting.",
    },
    renderAngles: {
      ghost: "ghost-mannequin front view, single jersey, natural fabric volume",
      flat: "top-down flat-lay, single jersey laid flat and symmetric",
      back: "ghost-mannequin back view, single jersey",
    },
    defaultRender: { angle: "ghost", backdrop: "warm-cream studio backdrop" },
    renderRules: "Symmetric garment, even sleeve lengths, natural fabric drape, undistorted collar, no warped seams, no lettering or numbers unless specified, no logos.",
  },
};

export function getProductType(id) {
  return PRODUCT_TYPES[id] || PRODUCT_TYPES.sneaker;
}

// ── Per-type lookups (used by the studio UI) ──────────────────────────────────
export function getSilhouette(productType, name) {
  const pt = getProductType(productType);
  return pt.silhouettes[name] || pt.silhouettes[pt.defaultSilhouette];
}
export function getColorway(productType, name) {
  const pt = getProductType(productType);
  return pt.colorways[name] || pt.colorways[pt.defaultColorway];
}
export function getZoneLabels(productType) {
  return getProductType(productType).zoneLabels;
}
export function getSystemPrompt(productType) {
  return getProductType(productType).systemPrompt;
}
// The watch anti-distortion / brand-neutral tail, reused by the designer agent's
// rendered prompts so generated and template prompts share one safety rail.
export function renderWatchRules() {
  return PRODUCT_TYPES.watch.renderRules;
}
export function getThemes() {
  return THEMES;
}
export function findTheme(_productType, id) {
  return findThemeRaw(id);
}

// ── Spec block (shared by single-product and matching-set builders) ───────────
// Emits the labelled construction + colourway lines for one piece, WITHOUT the
// trailing RENDER line. `includeColourway: false` drops the per-piece colourway
// so a shared palette can govern a matching set instead.
function specBlock(pt, { modelName, paletteName, materialName, aiMode, themeId, refineNote, signatureFeature, colorway, construction } = {}, { includeColourway = true } = {}) {
  const sil = { ...getSilhouette(pt.id, modelName), ...(construction || {}) };
  const colors = { ...getColorway(pt.id, paletteName), ...(colorway || {}) };
  const material = pt.materials[materialName] || pt.materialFallback;
  const style = pt.styleBlurbs[aiMode] || "";
  const theme = themeId ? findThemeRaw(themeId) : null;

  const lines = [];
  for (const f of pt.specFields) {
    if (sil[f.key]) lines.push(`${f.label}: ${sil[f.key]}.`);
  }
  lines.push(`${pt.materialLabel}: ${material}.`);

  if (includeColourway) {
    const zoneLines = sil.zones
      .filter((z) => colors[z])
      .map((z) => `- ${pt.zoneLabels[z]}: ${colors[z]}`);
    zoneLines.sort((a, b) => {
      const za = pt.zoneOrder.findIndex((z) => a.startsWith(`- ${pt.zoneLabels[z]}:`));
      const zb = pt.zoneOrder.findIndex((z) => b.startsWith(`- ${pt.zoneLabels[z]}:`));
      return za - zb;
    });
    lines.push("COLOURWAY (apply each colour only to its named zone):");
    lines.push(...zoneLines);
  }

  if (signatureFeature && signatureFeature.trim()) {
    lines.push(`SIGNATURE DETAIL (the single iconic feature — make it the focal point, keep everything else restrained): ${signatureFeature.trim()}`);
  }
  if (style) lines.push(`MOOD: ${style}`);
  if (theme) {
    const hint = theme.hints[pt.id] || theme.hints.default;
    if (hint) lines.push(`THEME DIRECTION: ${hint}`);
  }
  if (refineNote && refineNote.trim()) lines.push(`CREATOR NOTE: ${refineNote.trim()}`);

  return lines;
}

function buildRenderLine(pt, render) {
  const r = { ...pt.defaultRender, ...(render || {}) };
  const angle = pt.renderAngles[r.angle] || pt.renderAngles[pt.defaultRender.angle];
  return `RENDER: studio product photography, ${angle}, soft directional natural light from upper left, ${r.backdrop}, gentle ground shadow, 1:1 square crop, high resolution, editorial. ${pt.renderRules}`;
}

// ── Single-product prompt ─────────────────────────────────────────────────────
// The studio calls this with the original four knobs ({ modelName, paletteName,
// materialName, aiMode }) plus themeId / refineNote; everything else is additive.
// productType defaults to "sneaker" so existing callers are unchanged.
export function buildUserPrompt({ productType = "sneaker", ...args } = {}) {
  const pt = getProductType(productType);
  const lines = specBlock(pt, args);
  lines.push("");
  lines.push(buildRenderLine(pt, args.render));
  return lines.join("\n");
}

// ── Matching set ──────────────────────────────────────────────────────────────
// Several pieces, one editorial flat-lay, one shared palette — the "matching
// sneaker + trikot in one prompt" payoff. When `sharedPalette` is given it is
// authoritative and the per-piece colourways are dropped so the set reads as one
// coordinated drop; without it, each piece keeps its own named colourway.
export const MATCHING_SYSTEM_PROMPT = `You are a product photographer shooting a coordinated capsule collection for an editorial design house.

ABSOLUTE RULES — violating any one means the image is unusable:
- Every piece is brand-neutral: NO real-world brand logo, crest, wordmark, or signature of any kind on any item.
- No text, lettering, numbers, badges, or watermarks on any piece unless the brief specifies it.
- Each piece stays true to its own spec block; do not merge pieces or invent extra items.

HOW TO READ THE BRIEF:
- The brief lists several PIECES, each its own labelled spec block.
- A single SHARED PALETTE governs all pieces — apply the same colours and material feel consistently across every item so they read as one matching collection.

AESTHETIC:
- Editorial flat-lay, all pieces arranged together in one frame, shot from directly above.
- Calm, restrained, material-honest. Soft even daylight. Neutral warm-cream studio surface, soft shadows.
- Consistent colour grading and lighting across all pieces so the set looks like one drop.`;

export function buildMatchingSetPrompt({ items = [], sharedPalette, themeId, aiMode, refineNote } = {}) {
  const lines = [];
  const palette = sharedPalette && sharedPalette.trim();
  if (palette) lines.push(`SHARED PALETTE (apply consistently to every piece): ${palette}`);

  const theme = themeId ? findThemeRaw(themeId) : null;
  if (theme && (theme.hints.default || theme.hints.sneaker)) {
    lines.push(`SHARED THEME DIRECTION: ${theme.hints.default || theme.hints.sneaker}`);
  }

  items.forEach((it, i) => {
    const pt = getProductType(it.productType);
    lines.push("");
    lines.push(`PIECE ${i + 1} — ${pt.label.toUpperCase()}:`);
    const block = specBlock(
      pt,
      { ...it, aiMode: it.aiMode || aiMode, themeId },
      { includeColourway: !palette }
    );
    lines.push(...block.map((l) => `  ${l}`));
  });

  if (refineNote && refineNote.trim()) {
    lines.push("");
    lines.push(`CREATOR NOTE: ${refineNote.trim()}`);
  }

  lines.push("");
  lines.push(`RENDER: editorial flat-lay of all ${items.length} pieces arranged together in one frame, shot from directly above, soft even daylight, neutral warm-cream studio surface, soft shadows, consistent colour grading across every piece, 1:1 square crop, high resolution. Each piece undistorted and true to its own proportions; brand-neutral with no text or logos.`);
  return lines.join("\n");
}
