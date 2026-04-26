#!/usr/bin/env node
/**
 * Hype-v2 bulk regen — all 40 designs, in place.
 *
 * Why: v1 prompts optimised for MUJI/Kinfolk calm — actively fighting hype.
 * v2 swaps the aesthetic register to Hypebeast/Highsnobiety hero-shot,
 * keeps the brand-neutral legal moat, and adds per-design hero-detail
 * callouts (the "screenshot moment").
 *
 * Validation pass on 3 designs lifted them from 55-70 → 85-88 hype.
 * This bulk pass applies the same treatment to all 40, replacing the
 * /public/sneakers/*.png and /public/sneakers/themed/<col>/*.png in place.
 * v1 versions remain in git history — `git checkout HEAD~1 -- public/sneakers`
 * restores them if needed.
 *
 * Output paths:
 *   public/sneakers/<slug>.png              (starter library, 20)
 *   public/sneakers/themed/mixed/<slug>.png (themed mixed, 10)
 *   public/sneakers/themed/pocket-creatures/<slug>.png (pocket creatures, 10)
 *
 * Cost: ~€0.20 (40 × ~€0.005). Time: ~3 min at concurrency 4.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);
const ONLY = (process.env.ONLY || "").trim();   // optional: comma-separated slug allowlist

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

const COMPOSITION_TAIL = `Render as a magazine-cover hero shot: low-angle three-quarter front, single sneaker filling 70-80% of the frame, dramatic studio lighting from the upper-left, deep sculptural shadow on the opposite side, crisp shadow grounding the sole, palpable texture. Square 1:1 crop, ultra-high detail, editorial.`;

// ───────────────────── 40 DESIGNS WITH HYPE-V2 BRIEFS ─────────────────────
//
// Each brief = silhouette + colour story + HERO DETAIL + backdrop colour.
// HERO DETAIL is the one specific thing that makes the photo screenshot-worthy.

const designs = [
  // ─── Starter library: Aeris Flow line (chunky lifestyle runner) ───
  { out: "aeris-flow.png", brief: `A chunky lifestyle running sneaker with sculpted segmented midsole.
Dominant: pearl off-white knit upper with visible weave texture.
Bold accent: deep obsidian-black heel cup wraps forward, matching black tongue, single chrome-silver stripe along the midsole edge.
HERO DETAIL: the chrome stripe catches the key light and runs the full length of the midsole — a single line of polished metal that defines the silhouette.
Backdrop: deep charcoal flat sweep with subtle gradient.` },
  { out: "aeris-mocha.png", brief: `A chunky lifestyle running sneaker with sculpted segmented midsole.
Dominant: rich espresso-brown cloud suede upper with palpable nap.
Bold accent: cream knit collar, cream sculpted midsole, single brushed-bronze grommet on the heel pull tab.
HERO DETAIL: the espresso suede catches dramatic side light revealing the nap direction and stitching.
Backdrop: warm caramel flat sweep with deep brown vignette.` },
  { out: "aeris-storm.png", brief: `A chunky lifestyle running sneaker with sculpted segmented midsole.
Dominant: matte obsidian-black carbon mesh upper with visible weave.
Bold accent: a single saturated cobalt-blue mesh panel wraps from heel to mid-foot, cobalt laces, polished chrome lace eyelets.
HERO DETAIL: the cobalt panel cuts a sharp diagonal line across the upper — pure speed energy.
Backdrop: deep midnight-blue flat sweep, cool gel light from upper-left.` },
  { out: "aeris-meadow.png", brief: `A chunky lifestyle running sneaker with sculpted segmented midsole.
Dominant: saturated sage-green plant-based leather upper with visible grain.
Bold accent: warm tan suede heel cup, gum-rubber midsole edge, cream stitching across the side panel in an organic vine pattern.
HERO DETAIL: the vine-pattern cream stitching reads as botanical embroidery — slow-fashion craftsmanship.
Backdrop: deep forest-green flat sweep with golden upper-left rim light.` },
  { out: "aeris-pearl.png", brief: `A chunky lifestyle running sneaker with sculpted segmented midsole.
Dominant: pearl-white plant-based leather upper, panels in three large geometric segments with visible 4mm gaps between them.
Bold accent: matte champagne-gold midsole edge piping running the full sole, cream laces, faint warm-pink heel tab inset.
HERO DETAIL: the gold midsole edge piping is a thin metallic line that wraps the entire sole — quiet luxury made loud.
Backdrop: warm dusty-rose flat sweep, soft gold rim light.` },

  // ─── Court Heritage line (retro court) ───
  { out: "court-heritage.png", brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: deep saturated forest-green smooth bio-leather upper.
Bold accent: PLAIN cream/off-white side panel (no stripes, no decoration), tan suede toe-box, gum rubber sole, flat waxed cream laces, brushed-brass round eyelets.
HERO DETAIL: the brass eyelets catch warm light against deep green leather — heritage craft signal.
Backdrop: deep emerald-green flat sweep with warm amber side light.` },
  { out: "court-noir.png", brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: matte jet-black smooth bio-leather upper.
Bold accent: PLAIN ivory cream side panel (no stripes), black suede toe-box, ivory sole, flat waxed black laces, polished chrome round eyelets.
HERO DETAIL: a single curving cream-leather inset on the side panel reads as a confident negative-space sweep.
Backdrop: deep charcoal flat sweep with high-contrast cool key light.` },
  { out: "court-cream.png", brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: ivory cream smooth bio-leather upper.
Bold accent: deep oxblood-burgundy heel tab, oxblood waxed laces, oxblood inner lining peeking from under the tongue.
HERO DETAIL: a sculptural oxblood-burgundy heel pull-tab with brushed-bronze metal grommet — the kind of detail that becomes the photo caption.
Backdrop: deep oxblood-burgundy flat sweep with subtle vignette.` },
  { out: "court-rose.png", brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: dusty rose-pink smooth bio-leather upper, saturated.
Bold accent: PLAIN cream side panel, warm camel suede toe-box, sand rubber cup-sole, brushed-rose-gold round eyelets, cream waxed laces.
HERO DETAIL: rose-gold eyelets wink against the dusty pink — soft palette, hard hardware.
Backdrop: warm coral-pink flat sweep with golden rim light.` },
  { out: "court-cobalt.png", brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: deep saturated cobalt-blue smooth bio-leather upper.
Bold accent: PLAIN cream side panel (no stripes), navy suede toe-box, gum rubber cup-sole, flat waxed cream laces, brushed-silver round eyelets.
HERO DETAIL: the deep cobalt-blue catches dramatic side light against the cream side panel — confident colour-block.
Backdrop: deep navy flat sweep with cool key light.` },

  // ─── Future Slip line (comfort mule) ───
  { out: "future-slip.png", brief: `A futuristic comfort slip-on mule sneaker, sculptural single-piece silhouette, no laces, thick foam midsole.
Dominant: sand-beige cloud suede upper with a fine nap.
Bold accent: matte obsidian-black thick sculpted foam midsole with visible ridges, ivory inner lining peeking at the topline.
HERO DETAIL: the contrast between sand-suede top and obsidian-foam bottom is brutal — like sand poured over volcanic glass.
Backdrop: deep terracotta flat sweep with warm dramatic side light.` },
  { out: "slip-onyx.png", brief: `A futuristic comfort slip-on mule sneaker, sculptural single-piece silhouette, no laces, thick foam midsole.
Dominant: matte jet-black cloud suede upper, completely tonal.
Bold accent: a single chrome-silver edge piping wraps the entire topline of the upper, matching black sculpted foam midsole with sharp ridges.
HERO DETAIL: the chrome topline is the only break in pure black — a single polished line that defines the silhouette.
Backdrop: deep charcoal-grey flat sweep with cool blue rim light.` },
  { out: "slip-cloud.png", brief: `A futuristic comfort slip-on mule sneaker, sculptural single-piece silhouette, no laces, thick foam midsole.
Dominant: pearl-white cloud suede upper with a fine nap, completely tonal.
Bold accent: champagne-gold edge piping along the topline, ivory thick sculpted foam midsole with visible swirling sculpted ridges.
HERO DETAIL: the swirling sculpted midsole ridges catch dramatic side light — architectural foam.
Backdrop: warm cream-to-rose gradient sweep with golden rim light.` },
  { out: "slip-moss.png", brief: `A futuristic comfort slip-on mule sneaker, sculptural single-piece silhouette, no laces, thick foam midsole.
Dominant: deep saturated moss-green knit upper with palpable weave texture.
Bold accent: gum-rubber thick sculpted foam midsole, single tan suede heel pull tab.
HERO DETAIL: the moss-knit texture catches dramatic side light revealing every yarn — slow craft made bold.
Backdrop: warm golden-amber flat sweep with low-angle drama.` },
  { out: "slip-clay.png", brief: `A futuristic comfort slip-on mule sneaker, sculptural single-piece silhouette, no laces, thick foam midsole.
Dominant: warm saturated terracotta-clay plant-leather upper with smooth grain.
Bold accent: matte obsidian-charcoal thick sculpted foam midsole, single brushed-bronze grommet on the side panel.
HERO DETAIL: the terracotta upper glows against deep charcoal foam — earth made architectural.
Backdrop: deep brick-red flat sweep with warm dramatic key light.` },

  // ─── Trailforge X line (performance trail) ───
  { out: "trailforge-x.png", brief: `A rugged performance trail running sneaker with aggressive lugged outsole, technical synthetic overlays, slim heel cup.
Dominant: matte obsidian-black carbon mesh upper with visible technical overlays.
Bold accent: saturated cobalt-blue technical overlays on side panels and laces, dark charcoal aggressive lugs, single chrome heel reflector.
HERO DETAIL: the cobalt overlays cut sharp angular lines across the upper — pure techwear aggression.
Backdrop: deep slate-grey flat sweep with cool blue gel light.` },
  { out: "trail-bronze.png", brief: `A rugged performance trail running sneaker with aggressive lugged outsole, technical synthetic overlays, slim heel cup.
Dominant: warm bronze-tan carbon mesh upper with visible weave.
Bold accent: cream technical overlays on side panels, sand-tan aggressive lugs, deep brown laces, brushed-brass speed-lacing hooks.
HERO DETAIL: the brushed-brass speed-lacing hooks add hardware-jewellery to the bronze upper.
Backdrop: deep amber flat sweep with warm dramatic side light.` },
  { out: "trail-fog.png", brief: `A rugged performance trail running sneaker with aggressive lugged outsole, technical synthetic overlays, slim heel cup.
Dominant: pale fog-grey carbon mesh upper with visible technical weave.
Bold accent: saturated sage-green technical overlays on side panels, sage laces, soft grey aggressive lugs, single chrome reflective heel patch.
HERO DETAIL: the sage overlays read as moss against fog — quiet techwear with one bright chord.
Backdrop: deep sage-green flat sweep with cool grey rim light.` },
  { out: "trail-rust.png", brief: `A rugged performance trail running sneaker with aggressive lugged outsole, technical synthetic overlays, slim heel cup.
Dominant: deep saturated forest-green carbon mesh upper with visible weave.
Bold accent: rust-orange technical overlays cutting diagonally across side panels, rust laces, dark olive aggressive lugs, brushed-bronze speed-lacing hooks.
HERO DETAIL: the rust overlays slash across green like autumn fire on pine — a single dramatic colour break.
Backdrop: deep rust-orange flat sweep with low-angle warm key light.` },
  { out: "trail-night.png", brief: `A rugged performance trail running sneaker with aggressive lugged outsole, technical synthetic overlays, slim heel cup.
Dominant: matte obsidian-black cloud suede upper, completely tonal.
Bold accent: black carbon mesh side panel inserts, all-black aggressive lugs, single tactical reflective-grey logo-shaped patch on the heel (plain, no text).
HERO DETAIL: the tonal-black design has a single reflective-grey heel patch that flashes under the key light — stealth signal.
Backdrop: deep charcoal flat sweep with cool blue rim light from upper-left.` },

  // ─── Themed: mixed (10) ───
  { out: "themed/mixed/galactic-knight.png", brief: `A chunky lifestyle running sneaker with segmented plate-like upper overlays.
Dominant: matte chalk-white plant-based leather upper, segmented into three large geometric plate panels separated by narrow black inset channels.
Bold accent: deep obsidian-black side panel that wraps from heel forward like the inset of a knight's visor; matte black laces; matte black sculpted midsole with thin chrome stripe along the midsole edge.
HERO DETAIL: the side panel reads as a visor inset — a single curving black panel with chrome rim — instantly telegraphing "armour" without any character depiction.
Backdrop: deep charcoal-grey flat sweep with subtle blue-grey gradient.` },
  { out: "themed/mixed/stitched-hero.png", brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: bold saturated crimson-red bio-leather upper.
Bold accent: deep navy panels along the heel and toe, fine cream web-style decorative stitching pattern across the side panel forming a hexagonal grid, polished black gum-rubber cup-sole, flat waxed cream laces.
HERO DETAIL: the hexagonal cream web stitching across the side panel is unmistakable — heroic graphic statement.
Backdrop: deep navy flat sweep with crimson rim light from upper-right.` },
  { out: "themed/mixed/dragon-scale.png", brief: `A rugged performance trail running sneaker with aggressive lugged outsole, technical synthetic overlays.
Dominant: deep midnight-blue carbon mesh upper with visible weave.
Bold accent: iridescent scale-pattern overlay covering the entire side panel (refracts teal, violet, gold under light), bone-white aggressive lugged outsole, single tan-leather heel pull tab.
HERO DETAIL: the iridescent scale overlay shifts colour as the light moves across it — full-side dragon-skin moment.
Backdrop: deep midnight-blue flat sweep with cool teal gel light.` },
  { out: "themed/mixed/theme-park-heritage.png", brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: nostalgic cream smooth bio-leather upper.
Bold accent: bold saturated cherry-red side panel wrapping from heel forward, polished round details, playful slightly-cartoon proportions, cream gum-rubber cup-sole, flat waxed cream laces, brushed-gold round eyelets.
HERO DETAIL: the gold eyelets and cherry-red panel sing together — heritage joy with hardware confidence.
Backdrop: deep cherry-red flat sweep with warm golden side light.` },
  { out: "themed/mixed/sky-pirate.png", brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: distressed cherry-red bio-leather upper with visible weathering and patina.
Bold accent: oversized antique-brass round eyelets, natural straw-rope laces, weathered tan gum-rubber cup-sole, single brass-buckle ankle strap detail.
HERO DETAIL: the brass-buckle ankle strap is the unmistakable pirate signal — hardware that reads as story.
Backdrop: deep weathered-burgundy flat sweep with warm amber low-angle light.` },
  { out: "themed/mixed/forest-spirit.png", brief: `A chunky lifestyle running sneaker with sculpted segmented midsole.
Dominant: deep saturated moss-green cloud suede upper with palpable nap.
Bold accent: warm earth-tone tan leather heel and tongue overlays, hand-drawn weathered patina across the upper, organic cream stitching forming a leaf-vein pattern on the side panel, soft cream sculpted midsole.
HERO DETAIL: the leaf-vein cream stitching covers the entire side panel — botanical embroidery as design moment.
Backdrop: warm forest-amber flat sweep with golden rim light from upper-left.` },
  { out: "themed/mixed/bath-house-dream.png", brief: `A futuristic comfort slip-on mule sneaker, sculptural single-piece silhouette, no laces, thick foam midsole.
Dominant: soft pastel-pink cloud suede upper.
Bold accent: lilac-purple side panel with cream wave-pattern overlay running horizontally, sculptural single-piece silhouette, ivory thick foam midsole with visible swirling steam-like sculpted ridges.
HERO DETAIL: the swirling steam-like sculpted ridges on the midsole catch dramatic side light — dreamlike architecture.
Backdrop: deep saturated lilac flat sweep with soft pink rim light.` },
  { out: "themed/mixed/demon-hunter.png", brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: deep saturated forest-green smooth bio-leather upper.
Bold accent: bold black checkered haori-style pattern wrapping the entire side panel, polished silver round eyelets, blade-grey gum-rubber cup-sole, flat waxed black laces.
HERO DETAIL: the bold black-on-green checkered haori pattern covers the side panel — wearable tradition with confident punch.
Backdrop: deep emerald-green flat sweep with cool silver rim light.` },
  { out: "themed/mixed/scroll-master.png", brief: `A rugged performance trail running sneaker with aggressive lugged outsole, technical synthetic overlays.
Dominant: bold saturated burnt-orange carbon mesh upper with visible weave.
Bold accent: deep matte-black accents on tongue and heel, intricate scroll-style decorative stitching pattern across the side panel, matte black rope-like laces, dark khaki aggressive lugs.
HERO DETAIL: the intricate scroll stitching pattern across the side panel reads as ancient calligraphy — story-as-graphic.
Backdrop: deep matte-black flat sweep with dramatic orange rim light.` },
  { out: "themed/mixed/ancients-forge.png", brief: `A chunky lifestyle running sneaker with sculpted segmented midsole.
Dominant: warm bronze-toned bio-leather upper with subtle metallic sheen.
Bold accent: oversized antiqued-brass round eyelets (six per side, larger than usual), bold rune-style decorative stitching across the side panel in deep brown thread, deep umber sculpted midsole.
HERO DETAIL: the brass eyelets are oversized like ancient hardware, paired with rune stitching — a runesmith's shoe.
Backdrop: deep ember-red flat sweep with warm dramatic forge-glow side light.` },

  // ─── Themed: pocket-creatures (10) ───
  { out: "themed/pocket-creatures/electric-champ.png", brief: `A rugged performance trail running sneaker with aggressive lugged outsole, technical synthetic overlays.
Dominant: bright saturated lemon-yellow carbon mesh upper with visible weave.
Bold accent: sharp jet-black accents on heel cup, tongue, and laces, bold black lightning-bolt decorative stitching forming a single dramatic zigzag across the side panel, dark grey aggressive lugged outsole, glossy finish.
HERO DETAIL: the black lightning-bolt zigzag stitching across the side panel is unmistakable — pure electric energy.
Backdrop: deep electric-yellow flat sweep with sharp black rim shadow.` },
  { out: "themed/pocket-creatures/charcoal-flame.png", brief: `A chunky lifestyle running sneaker with sculpted segmented midsole.
Dominant: warm saturated ember-orange bio-leather upper with smooth grain.
Bold accent: cream side panel wrapping from heel forward, single saturated sky-blue accent stripe at the heel pull, sculpted cream midsole with charred dark-grey rubber outsole.
HERO DETAIL: the sky-blue heel accent against ember-orange and cream is the signature — three-colour confidence.
Backdrop: deep ember-orange flat sweep with cool blue rim light from upper-right.` },
  { out: "themed/pocket-creatures/tidal-crown.png", brief: `A futuristic comfort slip-on mule sneaker, sculptural single-piece silhouette, no laces, thick foam midsole.
Dominant: deep saturated ocean-blue cloud suede upper with palpable nap.
Bold accent: subtle pearl-white wave-pattern stitching across the side panel, sculptural pearl-white shell-like overlay on the heel, ivory thick sculpted foam midsole with visible wave-like sculpted ridges.
HERO DETAIL: the pearl-white shell-like heel overlay is unmistakable — oceanic crown moment.
Backdrop: deep teal flat sweep with cool pearl rim light.` },
  { out: "themed/pocket-creatures/verdant-bulb.png", brief: `A chunky lifestyle running sneaker with sculpted segmented midsole.
Dominant: deep saturated forest-green knit upper with palpable weave.
Bold accent: dusty-pink cloud suede tongue and heel pull tab, organic cream leaf-vein stitching pattern covering the entire side panel, gum-rubber sculpted midsole.
HERO DETAIL: the cream leaf-vein stitching across the side panel reads as botanical embroidery — wearable garden.
Backdrop: deep emerald flat sweep with warm pink rim light.` },
  { out: "themed/pocket-creatures/psychic-spoon.png", brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: saturated lilac-violet bio-leather upper.
Bold accent: cream side panel with a wide curving holographic-iridescent overlay (refracts pale pink, mint, gold), polished chrome round eyelets, ivory waxed laces.
HERO DETAIL: the holographic-iridescent overlay on the side panel shifts colour with light — single moment of psychedelic shimmer.
Backdrop: deep saturated violet flat sweep with cool magenta gel light.` },
  { out: "themed/pocket-creatures/stone-mountain.png", brief: `A rugged performance trail running sneaker with aggressive lugged outsole, technical synthetic overlays.
Dominant: granite-grey carbon mesh upper with visible rough-textured panels.
Bold accent: warm earth-brown leather overlays wrapping the heel cup and toe, single brushed-bronze grommet on the heel pull, chunky aggressive lugged outsole in dark stone-grey.
HERO DETAIL: the warm earth-brown leather wrap against grey mesh adds tactile mountain warmth.
Backdrop: deep slate-grey flat sweep with warm amber low-angle key light.` },
  { out: "themed/pocket-creatures/ghost-veil.png", brief: `A futuristic comfort slip-on mule sneaker, sculptural single-piece silhouette, no laces, thick foam midsole.
Dominant: deep translucent-violet cloud suede upper with palpable nap.
Bold accent: subtle dark wisp-pattern stitching across the side panel forming swirling shapes, sculptural single-piece silhouette, deep matte-black thick foam midsole.
HERO DETAIL: the swirling dark wisp-pattern stitching reads as ghost-trails on the upper — moody and unmistakable.
Backdrop: deep saturated violet-black flat sweep with cool purple rim light.` },
  { out: "themed/pocket-creatures/iron-wing.png", brief: `A rugged performance trail running sneaker with aggressive lugged outsole, technical synthetic overlays.
Dominant: brushed-silver metallic-finish carbon mesh upper.
Bold accent: saturated steel-blue accents on heel cup and tongue, sky-blue laces, polished chrome round eyelets, dark grey aggressive lugged outsole, single feather-pattern decorative stitching on the side panel in steel-blue thread.
HERO DETAIL: the feather-pattern steel-blue stitching on the side panel is the signal — hardware-meets-flight.
Backdrop: deep steel-grey flat sweep with cool blue rim light.` },
  { out: "themed/pocket-creatures/frost-crystal.png", brief: `A chunky lifestyle running sneaker with sculpted segmented midsole.
Dominant: snow-white knit upper with palpable weave.
Bold accent: pale glacier-blue gradient covering the entire side panel, crystalline-pattern stitching in pale-blue thread forming geometric facets across the side panel, sculpted ivory midsole, pale grey rubber outsole.
HERO DETAIL: the crystalline-pattern stitching reads as actual ice facets — geometry as graphic.
Backdrop: deep ice-blue flat sweep with cool white rim light from upper-left.` },
  { out: "themed/pocket-creatures/solar-wing.png", brief: `A low-top retro court sneaker, slim profile, suede toe-box, gum rubber cup-sole.
Dominant: cream smooth bio-leather upper.
Bold accent: bold metallic-gold side panel wrapping from heel forward to mid-foot (covers most of the side), saturated ember-red accents on the tongue and heel pull, polished gold round eyelets, warm cream gum-rubber cup-sole.
HERO DETAIL: the metallic-gold side panel covers most of the side and catches dramatic key light — radiant solar moment.
Backdrop: deep ember-red flat sweep with warm gold rim light.` },
];

async function generate(d) {
  const out = path.join(ROOT, "public", "sneakers", d.out);
  await mkdir(path.dirname(out), { recursive: true });
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
  if (!res.ok) { const body = await res.text(); throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 200)}`); }
  const json = await res.json();
  const imageUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) throw new Error(`No image: ${JSON.stringify(json).slice(0, 200)}`);
  const b64 = imageUrl.split(",", 2)[1];
  await writeFile(out, Buffer.from(b64, "base64"));
  console.log(`   ✓ ${d.out} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return out;
}

async function pool(items, worker, concurrency) {
  const queue = [...items];
  const inFlight = new Set();
  const errors = [];
  while (queue.length || inFlight.size) {
    while (inFlight.size < concurrency && queue.length) {
      const item = queue.shift();
      const p = (async () => {
        try { await worker(item); }
        catch (e) { errors.push({ item, error: e }); console.error(`   ✗ ${item.out}: ${e.message}`); }
      })();
      inFlight.add(p);
      p.finally(() => inFlight.delete(p));
    }
    if (inFlight.size) await Promise.race(inFlight);
  }
  return errors;
}

const targets = ONLY
  ? designs.filter((d) => ONLY.split(",").map((s) => s.trim()).some((slug) => d.out.includes(slug)))
  : designs;

console.log(`Hype-v2 bulk regen · model ${MODEL} · concurrency ${CONCURRENCY} · ${targets.length}/${designs.length} designs\n`);
const errors = await pool(targets, generate, CONCURRENCY);
console.log(`\nDone. ${targets.length - errors.length}/${targets.length} succeeded.`);
if (errors.length) console.log(`Failed: ${errors.map((e) => e.item.out).join(", ")}\nRe-run with ONLY=<slug,slug> to retry.`);
