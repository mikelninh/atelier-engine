#!/usr/bin/env node
/**
 * Generate themed-drop collections.
 *
 * Two starter collections, each 10 sneakers:
 *   - mixed         : a top-10 across the major franchise inspirations
 *   - pocket-creatures : 10 sneakers inspired by classic creature-battle types
 *                        (electric, fire, water, grass, psychic, ghost, steel,
 *                        ice, rock, light) — generic colour + element direction,
 *                        zero franchise asset reuse.
 *
 * Outputs:
 *   public/sneakers/themed/<collection>/<slug>.png
 *   public/sneakers/themed/library.json   (manifest)
 *
 * Skips existing files. Uses the same hardened SYSTEM_PROMPT as the main
 * library generator. Run with FORCE=1 to regenerate everything.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const FORCE = process.env.FORCE === "1";
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);

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

const SYSTEM_PROMPT = `You are a product photographer for an editorial sneaker design house.

ABSOLUTE RULES — violating any one means the image is unusable:
- Brand-neutral generic silhouette. NO real-world brand logo of any kind.
- DO NOT draw an Adidas trefoil, three parallel side stripes, or Samba styling.
- DO NOT draw a Nike swoosh, Jumpman, or Air Max bubble.
- DO NOT draw a Puma formstrip, New Balance "N", Asics tiger stripes, Reebok vector,
  Converse star, or any Vans side stripe.
- DO NOT draw any text, lettering, numbers, tags, badges, or signature panels.
- DO NOT depict any copyrighted character, mascot, costume, helmet, weapon, or
  prop from any film, anime, manga, comic, video game, or franchise. Even when
  the design is "inspired by" a known property, the result must be a neutral,
  abstract sneaker that uses only the suggested colours, materials, and motifs.
- The side panel must be plain — no stripes, no logos, no perforated brand patterns.
- No tongue label text. No heel tab text. No insole text.
- No watermarks, no signatures, no captions.

AESTHETIC:
- Editorial product photography in the register of MUJI, Kinfolk, Cereal magazine.
- Calm, restrained, material-honest. Soft directional natural light from upper left.
- Neutral warm-cream studio backdrop with subtle floor shadow.
- Three-quarter front angle, single sneaker, square 1:1 crop.
- High detail on stitching, leather grain, knit weave, mesh, and rubber sole texture.`;

const COMPOSITION_TAIL = `Composition: studio product photography, three-quarter front angle, single sneaker on a soft warm-cream backdrop, soft directional natural light from upper left, gentle ground shadow. Square 1:1 crop, high resolution, editorial.`;

// ---------------- COLLECTIONS ----------------
//
// Each design = { collection, slug, name, modelName, paletteName, materialName,
//                 basePrice, badge, tagline, themeBrief }
// themeBrief is the design-specific user prompt body. Wrapped with COMPOSITION_TAIL.
const designs = [
  // ---------- mixed (10) — the "top 10" cross-franchise themed drops ----------
  {
    collection: "mixed", slug: "galactic-knight", name: "Galactic Knight", inspiredBy: "space-opera trooper armour",
    modelName: "Aeris Flow", paletteName: "Moonstone", materialName: "Bio Leather",
    basePrice: 289, badge: "Themed Drop", tagline: "Plate armour, cream finish.",
    themeBrief: `A chunky lifestyle running sneaker. Material: smooth plant-based leather upper. Matte white plate-like overlays segmented across the upper, deep black side-panel inset with a subtle visor-like silhouette, satin finish, dark slate-grey sole. Quiet luxury aesthetic.`,
  },
  {
    collection: "mixed", slug: "stitched-hero", name: "Stitched Hero", inspiredBy: "comic-book superhero suits",
    modelName: "Court Heritage", paletteName: "Cobalt Trail", materialName: "Bio Leather",
    basePrice: 269, badge: "Themed Drop", tagline: "Crimson + navy. Web stitch.",
    themeBrief: `A low-top retro court sneaker, slim profile. Material: smooth plant-based leather upper. Bold crimson-red leather upper, deep navy side panels, fine web-style decorative stitching pattern across the side panel, polished black gum-rubber cup-sole, flat waxed cream laces.`,
  },
  {
    collection: "mixed", slug: "dragon-scale", name: "Dragon Scale", inspiredBy: "viking dragon-rider tales",
    modelName: "Trailforge X", paletteName: "Cobalt Trail", materialName: "Carbon Mesh",
    basePrice: 299, badge: "Themed Drop", tagline: "Iridescent. Bone-soled.",
    themeBrief: `A rugged performance trail running sneaker. Material: carbon mesh upper with technical overlays. Deep midnight-blue upper with iridescent scale-pattern overlay across the side panel, bone-white aggressive lugged outsole, leather pull tab on heel.`,
  },
  {
    collection: "mixed", slug: "theme-park-heritage", name: "Theme Park Heritage", inspiredBy: "vintage theme-park mascots",
    modelName: "Court Heritage", paletteName: "Moonstone", materialName: "Bio Leather",
    basePrice: 249, badge: "Themed Drop", tagline: "Cream + cherry. Round joy.",
    themeBrief: `A low-top retro court sneaker, slim profile. Material: smooth plant-based leather upper. Nostalgic cream upper with bold cherry-red side panel, polished round details, playful slightly-cartoon proportions, cream gum-rubber cup-sole, flat waxed cream laces.`,
  },
  {
    collection: "mixed", slug: "sky-pirate", name: "Sky Pirate", inspiredBy: "swashbuckling sea-pirate epics",
    modelName: "Court Heritage", paletteName: "Sand Future", materialName: "Bio Leather",
    basePrice: 259, badge: "Themed Drop", tagline: "Brass eyelets. Rope laces.",
    themeBrief: `A low-top retro court sneaker, slim profile. Material: distressed plant-based leather upper. Cherry-red weathered leather upper with patina, antique brass round eyelets, natural straw-rope laces, weathered tan gum-rubber cup-sole.`,
  },
  {
    collection: "mixed", slug: "forest-spirit", name: "Forest Spirit", inspiredBy: "Studio Ghibli forests",
    modelName: "Aeris Flow", paletteName: "Forest Gum", materialName: "Cloud Suede",
    basePrice: 269, badge: "Themed Drop", tagline: "Moss. Earth. Quiet.",
    themeBrief: `A chunky lifestyle running sneaker. Material: soft suede upper with a fine nap. Soft moss-green suede upper, warm earth-tone leather accents on heel and tongue, hand-drawn weathered patina, slightly fuzzy nap, organic cream stitching, soft cream sole.`,
  },
  {
    collection: "mixed", slug: "bath-house-dream", name: "Bath House Dream", inspiredBy: "dreamlike Ghibli baths",
    modelName: "Future Slip", paletteName: "Sand Future", materialName: "Cloud Suede",
    basePrice: 279, badge: "Themed Drop", tagline: "Pink. Lilac. Steam.",
    themeBrief: `A futuristic comfort slip-on mule sneaker. Material: soft suede upper with a fine nap. Soft pastel pink and lilac panels with cream accents, gentle dreamlike palette, light steam-soft texture, sculptural single-piece silhouette, ivory thick foam midsole.`,
  },
  {
    collection: "mixed", slug: "demon-hunter", name: "Demon Hunter", inspiredBy: "demon-slaying anime",
    modelName: "Court Heritage", paletteName: "Forest Gum", materialName: "Bio Leather",
    basePrice: 269, badge: "Themed Drop", tagline: "Haori check. Blade silver.",
    themeBrief: `A low-top retro court sneaker, slim profile. Material: smooth plant-based leather upper. Dark forest-green leather upper with a subtle black checkered pattern across the side panel evoking a haori coat, polished silver round eyelets, blade-grey gum-rubber cup-sole, flat waxed black laces.`,
  },
  {
    collection: "mixed", slug: "scroll-master", name: "Scroll Master", inspiredBy: "shinobi anime",
    modelName: "Trailforge X", paletteName: "Sand Future", materialName: "Carbon Mesh",
    basePrice: 279, badge: "Themed Drop", tagline: "Orange ember. Black scroll.",
    themeBrief: `A rugged performance trail running sneaker. Material: carbon mesh upper with technical overlays. Warm orange upper, deep black accents on tongue and heel, scroll-style decorative stitching across the side panel, matte black rope-like laces, dark khaki lugged outsole.`,
  },
  {
    collection: "mixed", slug: "ancients-forge", name: "Forge of the Ancients", inspiredBy: "high-fantasy epics",
    modelName: "Aeris Flow", paletteName: "Sand Future", materialName: "Bio Leather",
    basePrice: 289, badge: "Themed Drop", tagline: "Bronze. Brass. Rune.",
    themeBrief: `A chunky lifestyle running sneaker. Material: smooth plant-based leather upper. Bronze-toned leather upper with subtle metallic sheen, antiqued brass round eyelets, rune-style decorative stitching on the side panel, deep umber sculpted midsole.`,
  },

  // ---------- pocket-creatures (10) — generic creature-battle elemental types ----------
  {
    collection: "pocket-creatures", slug: "electric-champ", name: "Electric Champion", inspiredBy: "electric-type creature",
    modelName: "Trailforge X", paletteName: "Cobalt Trail", materialName: "Carbon Mesh",
    basePrice: 269, badge: "Pocket Creature", tagline: "Lightning yellow.",
    themeBrief: `A rugged performance trail running sneaker. Material: carbon mesh upper. Bright lemon-yellow upper, sharp jet-black accents on heel cup and tongue, lightning-bolt decorative stitching across the side panel, glossy finish, dark grey lugged outsole.`,
  },
  {
    collection: "pocket-creatures", slug: "charcoal-flame", name: "Charcoal Flame", inspiredBy: "fire-type creature",
    modelName: "Aeris Flow", paletteName: "Sand Future", materialName: "Bio Leather",
    basePrice: 279, badge: "Pocket Creature", tagline: "Ember orange. Cream wing.",
    themeBrief: `A chunky lifestyle running sneaker. Material: smooth plant-based leather upper. Warm ember-orange leather upper, cream side panel, soft sky-blue accent on the heel pull tab, sculpted cream sole with charred dark grey outsole.`,
  },
  {
    collection: "pocket-creatures", slug: "tidal-crown", name: "Tidal Crown", inspiredBy: "water-type creature",
    modelName: "Future Slip", paletteName: "Cobalt Trail", materialName: "Cloud Suede",
    basePrice: 289, badge: "Pocket Creature", tagline: "Deep ocean. Pearl shell.",
    themeBrief: `A futuristic comfort slip-on mule sneaker. Material: soft suede upper with a fine nap. Deep ocean-blue suede upper with subtle wave-pattern stitching, pearl-white sculptural overlay on the heel like a shell, sculptural single-piece silhouette, ivory thick foam midsole.`,
  },
  {
    collection: "pocket-creatures", slug: "verdant-bulb", name: "Verdant Bulb", inspiredBy: "grass-type creature",
    modelName: "Aeris Flow", paletteName: "Forest Gum", materialName: "Pearl Knit",
    basePrice: 259, badge: "Pocket Creature", tagline: "Forest. Bud pink.",
    themeBrief: `A chunky lifestyle running sneaker. Material: adaptive knit upper with subtle weave texture. Soft forest-green knit upper, dusty pink accent on the tongue and heel pull, organic leaf-vein stitching pattern on the side panel, gum-rubber sole.`,
  },
  {
    collection: "pocket-creatures", slug: "psychic-spoon", name: "Psychic Spoon", inspiredBy: "psychic-type creature",
    modelName: "Court Heritage", paletteName: "Sand Future", materialName: "Bio Leather",
    basePrice: 259, badge: "Pocket Creature", tagline: "Lilac. Cream. Stillness.",
    themeBrief: `A low-top retro court sneaker, slim profile. Material: smooth plant-based leather upper. Soft lilac-purple leather upper, cream side panel and toe-box, polished silver round eyelets, ivory gum-rubber cup-sole, flat waxed cream laces.`,
  },
  {
    collection: "pocket-creatures", slug: "stone-mountain", name: "Stone Mountain", inspiredBy: "rock-type creature",
    modelName: "Trailforge X", paletteName: "Sand Future", materialName: "Carbon Mesh",
    basePrice: 279, badge: "Pocket Creature", tagline: "Granite. Earth. Weight.",
    themeBrief: `A rugged performance trail running sneaker. Material: carbon mesh upper with technical overlays. Granite-grey upper with rough-textured panels, warm earth-brown leather overlays on the heel cup, chunky aggressive lugged outsole in dark stone-grey.`,
  },
  {
    collection: "pocket-creatures", slug: "ghost-veil", name: "Ghost Veil", inspiredBy: "ghost-type creature",
    modelName: "Future Slip", paletteName: "Cobalt Trail", materialName: "Cloud Suede",
    basePrice: 289, badge: "Pocket Creature", tagline: "Translucent purple.",
    themeBrief: `A futuristic comfort slip-on mule sneaker. Material: soft suede upper with a fine nap. Deep translucent-purple suede upper with subtle dark wisp-pattern across the side panel, sculptural single-piece silhouette, deep black thick foam midsole.`,
  },
  {
    collection: "pocket-creatures", slug: "iron-wing", name: "Iron Wing", inspiredBy: "steel-type creature",
    modelName: "Trailforge X", paletteName: "Moonstone", materialName: "Carbon Mesh",
    basePrice: 289, badge: "Pocket Creature", tagline: "Brushed steel. Sky.",
    themeBrief: `A rugged performance trail running sneaker. Material: carbon mesh upper with technical overlays. Brushed-silver steel upper with steel-blue accents on the heel cup and tongue, sky-blue laces, polished silver eyelets, dark grey lugged outsole.`,
  },
  {
    collection: "pocket-creatures", slug: "frost-crystal", name: "Frost Crystal", inspiredBy: "ice-type creature",
    modelName: "Aeris Flow", paletteName: "Moonstone", materialName: "Pearl Knit",
    basePrice: 269, badge: "Pocket Creature", tagline: "Glacier blue. Snow.",
    themeBrief: `A chunky lifestyle running sneaker. Material: adaptive knit upper with subtle weave texture. Snow-white knit upper with pale glacier-blue gradient on the side panel, crystalline-pattern stitching, sculpted ivory midsole, pale grey rubber outsole.`,
  },
  {
    collection: "pocket-creatures", slug: "solar-wing", name: "Solar Wing", inspiredBy: "light-type creature",
    modelName: "Court Heritage", paletteName: "Sand Future", materialName: "Bio Leather",
    basePrice: 289, badge: "Pocket Creature", tagline: "Gold. Cream. Ember.",
    themeBrief: `A low-top retro court sneaker, slim profile. Material: smooth plant-based leather upper. Cream upper with metallic gold side panel, ember-red accent on the tongue and heel pull, polished gold round eyelets, warm cream gum-rubber cup-sole.`,
  },
];

async function generate(design) {
  const dir = path.join(ROOT, "public", "sneakers", "themed", design.collection);
  await mkdir(dir, { recursive: true });
  const out = path.join(dir, `${design.slug}.png`);
  if (!FORCE && existsSync(out)) { console.log(`   skip ${design.collection}/${design.slug} (exists)`); return out; }
  const t0 = Date.now();
  const userPrompt = `${design.themeBrief}\n\n${COMPOSITION_TAIL}`;
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
  console.log(`   ✓ ${design.collection}/${design.slug} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
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
        catch (e) { errors.push({ item, error: e }); console.error(`   ✗ ${item.collection}/${item.slug}: ${e.message}`); }
      })();
      inFlight.add(p);
      p.finally(() => inFlight.delete(p));
    }
    if (inFlight.size) await Promise.race(inFlight);
  }
  return errors;
}

async function writeManifest() {
  const manifestPath = path.join(ROOT, "public", "sneakers", "themed", "library.json");
  const manifest = {
    collections: [
      {
        id: "mixed",
        name: "Top 10 Themed Drops",
        subtitle: "Cross-franchise inspirations · all generic, all original.",
        items: designs.filter((d) => d.collection === "mixed").map((d) => ({
          slug: d.slug, name: d.name, inspiredBy: d.inspiredBy,
          modelName: d.modelName, paletteName: d.paletteName, materialName: d.materialName,
          basePrice: d.basePrice, badge: d.badge, tagline: d.tagline,
          image: `/sneakers/themed/mixed/${d.slug}.png`,
        })),
      },
      {
        id: "pocket-creatures",
        name: "Pocket Creatures",
        subtitle: "10 sneakers inspired by classic creature-battle elemental types.",
        items: designs.filter((d) => d.collection === "pocket-creatures").map((d) => ({
          slug: d.slug, name: d.name, inspiredBy: d.inspiredBy,
          modelName: d.modelName, paletteName: d.paletteName, materialName: d.materialName,
          basePrice: d.basePrice, badge: d.badge, tagline: d.tagline,
          image: `/sneakers/themed/pocket-creatures/${d.slug}.png`,
        })),
      },
    ],
  };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ wrote ${manifestPath} (${manifest.collections.reduce((n, c) => n + c.items.length, 0)} designs)`);
}

async function main() {
  console.log(`Model: ${MODEL} · Concurrency: ${CONCURRENCY} · Designs: ${designs.length}\n`);
  const errors = await pool(designs, generate, CONCURRENCY);
  await writeManifest();
  console.log(`\nDone. ${designs.length - errors.length}/${designs.length} successful.`);
  if (errors.length) console.log(`Re-run to retry failed slugs (existing files skipped).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
