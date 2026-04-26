#!/usr/bin/env node
/**
 * Hype-v2 prompt validation run.
 *
 * Goal: prove a new aesthetic register ("Hypebeast / Highsnobiety hero shot",
 * NOT MUJI calm) plus per-design hero-detail callouts can lift the worst
 * designs from "tasteful but quiet" to "stop-the-feed".
 *
 * Validation set (3 designs, ~€0.015):
 *   - court-cream            (starter library, scored 55 — bland vanilla)
 *   - themed/mixed/galactic-knight   (themed, scored 55 — failed armour brief)
 *   - themed/pocket-creatures/psychic-spoon (themed, scored 70 — too soft)
 *
 * Outputs land in public/sneakers/_hype-v2/ so the live App.jsx is untouched
 * until we pick winners. After review, the same approach can be batched across
 * all 40 designs.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function loadEnv() {
  const local = path.join(ROOT, ".env.local");
  if (existsSync(local)) {
    for (const line of readFileSync(local, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) { console.error("OPENROUTER_API_KEY not set."); process.exit(1); }
const MODEL = process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image";

// ───────────────────── HYPE-V2 SYSTEM PROMPT ─────────────────────
//
// Two changes vs. v1:
//   1. Aesthetic register: Highsnobiety / Hypebeast / Sneaker Freaker hero shot,
//      NOT MUJI / Kinfolk calm. The v1 prompt was sabotaging hype with its
//      "soft, restrained, neutral cream backdrop" rules.
//   2. Hard requirement for ONE unmistakable hero detail per design (the thing
//      that becomes the conversation in a Hypebeast post caption).
//
// Brand-neutral legal moat is unchanged — no logos, no characters, no text.
const SYSTEM_PROMPT = `You are a sneaker editorial photographer for the cover of a hype-culture magazine (Hypebeast, Highsnobiety, Sneaker Freaker).

ABSOLUTE RULES — violating any one means the image is unusable:
- Brand-neutral generic silhouette. NO real-world brand logo of any kind.
- DO NOT draw an Adidas trefoil, three parallel side stripes, or Samba styling.
- DO NOT draw a Nike swoosh, Jumpman, or Air Max bubble.
- DO NOT draw a Puma formstrip, New Balance "N", Asics tiger stripes, Reebok vector,
  Converse star, or any Vans side stripe.
- DO NOT draw any text, lettering, numbers, tags, badges, or signature panels.
- DO NOT depict any copyrighted character, mascot, costume, helmet, weapon, or
  prop from any film, anime, manga, comic, video game, or franchise.
- The side panel must be plain — no stripes, no logos, no perforated brand patterns.
- No tongue label text. No heel tab text. No insole text.
- No watermarks, no signatures, no captions.

HERO-SHOT AESTHETIC — this is the difference between a quiet product shot and a viral drop:
- This is a magazine COVER, not a catalogue page. Confident, hero-forward.
- BOLD COLOUR BLOCKING. Saturate the accent colour. Make every panel intentional.
- ONE unmistakable hero detail per shoe — the thing that makes someone screenshot it.
- Dramatic directional studio lighting (often coloured gel from upper-left or
  upper-right) — deep, sculptural shadows on the opposite side of the upper.
- Low-angle three-quarter perspective so the silhouette feels MASSIVE.
- Backdrop colour pulled from the design's accent palette — a bold flat sweep
  (deep navy, oxblood, mustard, jade, charcoal — NOT bland cream) that makes
  the sneaker pop. Subtle gradient acceptable; flat colour preferred.
- High contrast. Crisp shadow under the sole. No pastel haze.
- Texture must be palpable: stitching visible, leather grain visible, mesh weave
  visible, sole ridges visible. Editorial macro detail.
- Square 1:1 crop, single sneaker, fills 70-80% of the frame.

Think: this image will run as the cover of a sneaker drop announcement. If it
doesn't stop the scroll, the design dies on the marketplace.`;

// ───────────────────── 3 VALIDATION DESIGNS ─────────────────────
//
// Each brief calls out (a) the silhouette, (b) the dominant colour story
// with bold accent, (c) the explicit HERO DETAIL, and (d) a backdrop colour
// that complements.
const designs = [
  {
    slug: "court-cream",
    out: "court-cream.v2.png",
    brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: ivory cream smooth bio-leather upper.
Bold accent: deep oxblood-burgundy heel tab, oxblood waxed laces, oxblood inner lining peeking from under the tongue.
HERO DETAIL: a sculptural oxblood-burgundy heel pull-tab with brushed-bronze metal grommet — the kind of detail that becomes the photo caption.
Composition: low-angle three-quarter front, single sneaker on a deep oxblood-burgundy flat backdrop with subtle vignette, dramatic upper-left key light casting a sculptural shadow, crisp shadow under the gum sole. Cream and oxblood: confident contrast.`,
  },
  {
    slug: "galactic-knight",
    out: "galactic-knight.v2.png",
    brief: `A chunky lifestyle running sneaker with a sculpted midsole and segmented plate-like upper overlays.
Dominant: matte chalk-white plant-based leather upper, segmented into three large geometric plate panels separated by narrow black inset channels.
Bold accent: deep obsidian-black side panel that wraps from the heel forward like the inset of a knight's visor; matte black laces; matte black sculpted midsole with a thin chrome stripe along the midsole edge.
HERO DETAIL: the side panel reads as a visor inset — a single curving black panel with a faint chrome rim — instantly telegraphing "armour" without depicting any character.
Composition: low-angle three-quarter front, single sneaker on a deep charcoal-grey flat backdrop with subtle blue-grey gradient, dramatic upper-left cool-white key light, crisp blade-shadow falling to the right. White, black, and a flash of chrome: hero-forward.`,
  },
  {
    slug: "psychic-spoon",
    out: "psychic-spoon.v2.png",
    brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: lilac-violet smooth bio-leather upper, saturated and rich (not pastel).
Bold accent: cream side panel with a single curving holographic-iridescent overlay across it (refracts pale pink, mint, gold), polished chrome round eyelets, ivory waxed laces.
HERO DETAIL: the holographic-iridescent panel curve catches the light and shifts colour — a single moment of psychedelic shimmer on an otherwise restrained shoe.
Composition: low-angle three-quarter front, single sneaker on a saturated deep violet flat backdrop, dramatic upper-left key light from a cool magenta gel that pulls the iridescence forward, crisp shadow under the gum sole. Lilac, cream, and shimmer: confident weirdness.`,
  },
];

const COMPOSITION_TAIL = `Render as a magazine-cover hero shot: low-angle three-quarter front, single sneaker filling 70-80% of the frame, dramatic studio lighting from the upper-left, deep sculptural shadow on the opposite side, crisp shadow grounding the sole, palpable texture. Square 1:1 crop, ultra-high detail, editorial.`;

async function generate(d) {
  const dir = path.join(ROOT, "public", "sneakers", "_hype-v2");
  await mkdir(dir, { recursive: true });
  const out = path.join(dir, d.out);
  const t0 = Date.now();
  const userPrompt = `${d.brief}\n\n${COMPOSITION_TAIL}`;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/mikelninh/atelier-engine",
      "X-Title": "Atelier Engine",
    },
    body: JSON.stringify({
      model: MODEL,
      modalities: ["image", "text"],
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) { const body = await res.text(); throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`); }
  const json = await res.json();
  const imageUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) throw new Error(`No image: ${JSON.stringify(json).slice(0, 300)}`);
  const b64 = imageUrl.split(",", 2)[1];
  await writeFile(out, Buffer.from(b64, "base64"));
  console.log(`   ✓ ${d.slug} → ${d.out} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return out;
}

console.log(`Hype-v2 validation · model ${MODEL} · ${designs.length} designs\n`);
const results = await Promise.allSettled(designs.map(generate));
const ok = results.filter((r) => r.status === "fulfilled").length;
console.log(`\nDone. ${ok}/${designs.length} succeeded. Compare in public/sneakers/_hype-v2/`);
