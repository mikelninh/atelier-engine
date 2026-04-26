// Shared prompt builder for the runtime sneaker generator. The same hardened
// system prompt the batch script uses, plus a parameterised user prompt that
// composes model / palette / material / AI style mode / optional creator note.

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

AESTHETIC:
- Editorial product photography in the register of MUJI, Kinfolk, Cereal magazine.
- Calm, restrained, material-honest. Soft directional natural light from upper left.
- Neutral warm-cream studio backdrop with subtle floor shadow.
- Three-quarter front angle, single sneaker, square 1:1 crop.
- High detail on stitching, leather grain, knit weave, mesh, and rubber sole texture.`;

const MODEL_BLURBS = {
  "Aeris Flow": "chunky lifestyle running sneaker with a sculpted midsole and subtle ridges, modern silhouette",
  "Court Heritage": "low-top retro court sneaker with slim profile, suede toe-box, plain side panel, gum rubber cup-sole, classic flat waxed laces",
  "Future Slip": "futuristic comfort slip-on mule sneaker, sculptural single-piece silhouette, no laces, thick foam midsole",
  "Trailforge X": "rugged performance trail running sneaker with aggressive lugged outsole, technical synthetic overlays, slim heel cup",
};

const PALETTE_BLURBS = {
  Moonstone: { upper: "soft off-white pearl", accent: "deep charcoal", sole: "ivory" },
  "Forest Gum": { upper: "deep forest green", accent: "tan suede toe-box", sole: "gum rubber amber" },
  "Sand Future": { upper: "warm sand-beige", accent: "soft cocoa brown", sole: "dark charcoal foam" },
  "Cobalt Trail": { upper: "matte obsidian black", accent: "cobalt blue", sole: "dark slate grey" },
};

const MATERIAL_BLURBS = {
  "Pearl Knit": "adaptive knit upper with subtle weave texture",
  "Cloud Suede": "soft premium suede upper with a fine nap",
  "Bio Leather": "plant-based leather upper with smooth grain",
  "Carbon Mesh": "performance carbon mesh upper with technical overlays",
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

const COMPOSITION = `Composition: studio product photography, three-quarter front angle, single sneaker on a soft warm-cream backdrop, soft directional natural light from upper left, gentle ground shadow. Square 1:1 crop, high resolution, editorial.`;

export function buildUserPrompt({ modelName, paletteName, materialName, aiMode, themeId, refineNote }) {
  const m = MODEL_BLURBS[modelName] || "lifestyle sneaker";
  const p = PALETTE_BLURBS[paletteName] || { upper: "neutral", accent: "subtle contrast", sole: "neutral" };
  const mat = MATERIAL_BLURBS[materialName] || "leather upper";
  const style = STYLE_BLURBS[aiMode] || "";
  const theme = themeId ? findTheme(themeId) : null;
  const themeLine = theme && theme.hint ? `Theme direction: ${theme.hint}` : "";
  const refine = refineNote && refineNote.trim() ? `Additional creator direction: ${refineNote.trim()}` : "";

  return [
    `A ${m}.`,
    `Material: ${mat}.`,
    `Colour: ${p.upper} primary upper, ${p.accent} accents, ${p.sole} sole.`,
    style,
    themeLine,
    refine,
    "",
    COMPOSITION,
  ]
    .filter(Boolean)
    .join("\n");
}
