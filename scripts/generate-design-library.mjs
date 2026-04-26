#!/usr/bin/env node
/**
 * Generate the 20-design starter library for creators.
 *
 * Each design is a colourway/material variant on one of the four base models
 * (Aeris Flow, Court Heritage, Future Slip, Trailforge X). The 20 cover the
 * 4×4×4 design space with creative, brand-neutral colourways.
 *
 * Skips any image that already exists in public/sneakers/ so we never burn
 * tokens regenerating known-good shots. Writes a JSON manifest to
 * public/sneakers/library.json that the React app can import.
 *
 * Usage:
 *   node scripts/generate-design-library.mjs
 *   FORCE=1 node scripts/generate-design-library.mjs   # regenerate all
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
if (!apiKey) {
  console.error("OPENROUTER_API_KEY not set.");
  process.exit(1);
}

const MODEL = process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image";

const SYSTEM_PROMPT = `You are a product photographer for an editorial sneaker design house.

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

// 20 designs. Each = { slug, name, creator, modelName, paletteName, materialName, basePrice, badge, tagline, archetypeBrief }
// archetypeBrief is the design-specific user prompt body (we wrap it with composition boilerplate).
const designs = [
  // ---- Aeris Flow line (chunky lifestyle runner) ----
  {
    slug: "aeris-flow",
    name: "Aeris Flow",
    creator: "MotionLab",
    modelName: "Aeris Flow",
    paletteName: "Moonstone",
    materialName: "Pearl Knit",
    basePrice: 249,
    badge: "Bestseller",
    tagline: "Light. Balanced. Effortless.",
    archetypeBrief: `Chunky lifestyle running sneaker. Off-white pearl knit upper with subtle weave texture, dark charcoal accents on heel and tongue, chunky sculpted white midsole with subtle ridges, black rubber outsole.`,
  },
  {
    slug: "aeris-mocha",
    name: "Aeris Mocha",
    creator: "Slow Studio",
    modelName: "Aeris Flow",
    paletteName: "Sand Future",
    materialName: "Cloud Suede",
    basePrice: 269,
    badge: "Editorial",
    tagline: "Café au lait silhouette.",
    archetypeBrief: `Chunky lifestyle running sneaker. Soft cocoa-brown cloud suede upper, cream knit collar, sculptural cream midsole with subtle ridges, dark espresso brown rubber outsole.`,
  },
  {
    slug: "aeris-storm",
    name: "Aeris Storm",
    creator: "Nightwalk",
    modelName: "Aeris Flow",
    paletteName: "Cobalt Trail",
    materialName: "Carbon Mesh",
    basePrice: 279,
    badge: "Performance",
    tagline: "Built for low light.",
    archetypeBrief: `Chunky lifestyle running sneaker. Dark charcoal carbon mesh upper with subtle cobalt blue heel accent, sculpted obsidian midsole, black rubber outsole.`,
  },
  {
    slug: "aeris-meadow",
    name: "Aeris Meadow",
    creator: "Hara Atelier",
    modelName: "Aeris Flow",
    paletteName: "Forest Gum",
    materialName: "Bio Leather",
    basePrice: 259,
    badge: "Slow Fashion",
    tagline: "Plant-based. Pasture-soft.",
    archetypeBrief: `Chunky lifestyle running sneaker. Sage-green plant-based leather upper, cream stitching, gum-rubber midsole, tan accents on heel pull.`,
  },
  {
    slug: "aeris-pearl",
    name: "Aeris Pearl",
    creator: "Quiet Foundry",
    modelName: "Aeris Flow",
    paletteName: "Moonstone",
    materialName: "Bio Leather",
    basePrice: 249,
    badge: "Minimalist",
    tagline: "All white. Nothing more.",
    archetypeBrief: `Chunky lifestyle running sneaker. Entirely off-white plant-based leather upper, no contrast, ivory midsole, cream rubber outsole. Quiet luxury.`,
  },

  // ---- Court Heritage line (retro court) ----
  {
    slug: "court-heritage",
    name: "Court Heritage",
    creator: "Court Culture",
    modelName: "Court Heritage",
    paletteName: "Forest Gum",
    materialName: "Bio Leather",
    basePrice: 219,
    badge: "Mass Appeal",
    tagline: "Retro soul. Modern edge.",
    archetypeBrief: `Low-top retro court sneaker, slim profile, suede toe-box, leather upper. Deep forest-green leather upper, plain cream/off-white side panel (no stripes), tan suede toe-box, gum rubber cup-sole, flat waxed cream laces.`,
  },
  {
    slug: "court-noir",
    name: "Court Noir",
    creator: "Atelier Black",
    modelName: "Court Heritage",
    paletteName: "Moonstone",
    materialName: "Bio Leather",
    basePrice: 229,
    badge: "Stealth",
    tagline: "Black on black on cream.",
    archetypeBrief: `Low-top retro court sneaker, slim profile. Matte black leather upper, plain ivory cream side panel (no stripes), black suede toe-box, ivory cream rubber cup-sole, flat waxed black laces.`,
  },
  {
    slug: "court-cream",
    name: "Court Cream",
    creator: "Linea",
    modelName: "Court Heritage",
    paletteName: "Moonstone",
    materialName: "Cloud Suede",
    basePrice: 209,
    badge: "Capsule",
    tagline: "Quiet. Confident. Cream.",
    archetypeBrief: `Low-top retro court sneaker, slim profile. Entirely cream/ivory soft suede upper with no contrast, plain side panel, matching cream toe-box, cream rubber cup-sole, flat waxed cream laces.`,
  },
  {
    slug: "court-rose",
    name: "Court Rose",
    creator: "Maison Sora",
    modelName: "Court Heritage",
    paletteName: "Sand Future",
    materialName: "Bio Leather",
    basePrice: 229,
    badge: "Capsule",
    tagline: "Dusty pink, sand sole.",
    archetypeBrief: `Low-top retro court sneaker, slim profile. Dusty rose-pink leather upper, plain cream side panel (no stripes), tan suede toe-box, sand-coloured rubber cup-sole, flat waxed cream laces.`,
  },
  {
    slug: "court-cobalt",
    name: "Court Cobalt",
    creator: "Yard Sport",
    modelName: "Court Heritage",
    paletteName: "Cobalt Trail",
    materialName: "Bio Leather",
    basePrice: 229,
    badge: "Hype Pick",
    tagline: "Deep blue. Cream gum.",
    archetypeBrief: `Low-top retro court sneaker, slim profile. Deep cobalt blue leather upper, plain cream side panel (no stripes), navy suede toe-box, gum rubber cup-sole, flat waxed cream laces.`,
  },

  // ---- Future Slip line (comfort mule) ----
  {
    slug: "future-slip",
    name: "Future Slip",
    creator: "Vision Collective",
    modelName: "Future Slip",
    paletteName: "Sand Future",
    materialName: "Cloud Suede",
    basePrice: 279,
    badge: "Hype Pick",
    tagline: "Not from now. From next.",
    archetypeBrief: `Futuristic comfort slip-on mule sneaker. Sand-beige cloud-suede upper with no laces, sculptural single-piece silhouette, deep dark charcoal sole with thick foam midsole.`,
  },
  {
    slug: "slip-onyx",
    name: "Slip Onyx",
    creator: "Atelier Black",
    modelName: "Future Slip",
    paletteName: "Cobalt Trail",
    materialName: "Cloud Suede",
    basePrice: 289,
    badge: "Stealth",
    tagline: "All shadow.",
    archetypeBrief: `Futuristic comfort slip-on mule sneaker. Matte black cloud-suede upper with no laces, sculptural single-piece silhouette, matching black foam midsole, no contrast.`,
  },
  {
    slug: "slip-cloud",
    name: "Slip Cloud",
    creator: "Quiet Foundry",
    modelName: "Future Slip",
    paletteName: "Moonstone",
    materialName: "Cloud Suede",
    basePrice: 269,
    badge: "Minimalist",
    tagline: "Walk on a pillow.",
    archetypeBrief: `Futuristic comfort slip-on mule sneaker. Pearl white cloud-suede upper with no laces, sculptural single-piece silhouette, ivory chunky foam midsole.`,
  },
  {
    slug: "slip-moss",
    name: "Slip Moss",
    creator: "Hara Atelier",
    modelName: "Future Slip",
    paletteName: "Forest Gum",
    materialName: "Pearl Knit",
    basePrice: 259,
    badge: "Slow Fashion",
    tagline: "Forest floor underfoot.",
    archetypeBrief: `Futuristic comfort slip-on mule sneaker. Moss-green knit upper with no laces, sculptural single-piece silhouette, gum rubber thick foam midsole.`,
  },
  {
    slug: "slip-clay",
    name: "Slip Clay",
    creator: "Sora Lab",
    modelName: "Future Slip",
    paletteName: "Sand Future",
    materialName: "Bio Leather",
    basePrice: 289,
    badge: "Editorial",
    tagline: "Terracotta in motion.",
    archetypeBrief: `Futuristic comfort slip-on mule sneaker. Warm terracotta-clay plant-leather upper with no laces, sculptural single-piece silhouette, charcoal foam midsole.`,
  },

  // ---- Trailforge X line (performance trail) ----
  {
    slug: "trailforge-x",
    name: "Trailforge X",
    creator: "Wild Origins",
    modelName: "Trailforge X",
    paletteName: "Cobalt Trail",
    materialName: "Carbon Mesh",
    basePrice: 259,
    badge: "Performance",
    tagline: "Built wild. Made to endure.",
    archetypeBrief: `Rugged performance trail running sneaker. Carbon-mesh black upper with cobalt blue accents on overlays and laces, aggressive chunky lugged outsole in dark grey, technical synthetic detailing, slim heel cup. Photographed on a dark slate backdrop.`,
  },
  {
    slug: "trail-bronze",
    name: "Trail Bronze",
    creator: "Wild Origins",
    modelName: "Trailforge X",
    paletteName: "Sand Future",
    materialName: "Carbon Mesh",
    basePrice: 269,
    badge: "Performance",
    tagline: "Sandstone trails.",
    archetypeBrief: `Rugged performance trail running sneaker. Carbon-mesh upper in warm bronze with cream technical overlays, chunky lugged outsole in sand-tan, slim heel cup. Photographed on warm-cream backdrop.`,
  },
  {
    slug: "trail-fog",
    name: "Trail Fog",
    creator: "Stillpoint",
    modelName: "Trailforge X",
    paletteName: "Moonstone",
    materialName: "Carbon Mesh",
    basePrice: 259,
    badge: "Stealth",
    tagline: "Quiet trail. Quiet step.",
    archetypeBrief: `Rugged performance trail running sneaker. Carbon-mesh pale fog-grey upper with subtle sage green technical overlays, soft grey lugged outsole, slim heel cup. Photographed on warm-cream backdrop.`,
  },
  {
    slug: "trail-rust",
    name: "Trail Rust",
    creator: "Forge Co.",
    modelName: "Trailforge X",
    paletteName: "Forest Gum",
    materialName: "Carbon Mesh",
    basePrice: 269,
    badge: "Editorial",
    tagline: "Autumn floor.",
    archetypeBrief: `Rugged performance trail running sneaker. Carbon-mesh upper in deep forest-green with rust-orange technical overlays and laces, dark olive lugged outsole, slim heel cup. Photographed on warm-cream backdrop.`,
  },
  {
    slug: "trail-night",
    name: "Trail Night",
    creator: "Nightwalk",
    modelName: "Trailforge X",
    paletteName: "Cobalt Trail",
    materialName: "Cloud Suede",
    basePrice: 289,
    badge: "Stealth",
    tagline: "Obsidian in motion.",
    archetypeBrief: `Rugged performance trail running sneaker. Matte obsidian black cloud-suede upper with carbon-mesh side overlays, all-black aggressive lugged outsole, no contrast accents. Photographed on dark slate backdrop.`,
  },
];

const COMPOSITION_TAIL = `Composition: studio product photography, three-quarter front angle, single sneaker, soft directional natural light from upper left, gentle ground shadow. Square 1:1 crop, high resolution, editorial.`;

async function generate(design) {
  const out = path.join(ROOT, "public", "sneakers", `${design.slug}.png`);
  if (!FORCE && existsSync(out)) {
    console.log(`   skip ${design.slug} (exists)`);
    return out;
  }
  const t0 = Date.now();
  const userPrompt = `${design.archetypeBrief}\n\n${COMPOSITION_TAIL}`;
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
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const imageUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) throw new Error(`No image: ${JSON.stringify(json).slice(0, 300)}`);
  const b64 = imageUrl.split(",", 2)[1];
  await writeFile(out, Buffer.from(b64, "base64"));
  console.log(`   ✓ ${design.slug} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
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
        catch (e) { errors.push({ item, error: e }); console.error(`   ✗ ${item.slug}: ${e.message}`); }
      })();
      inFlight.add(p);
      p.finally(() => inFlight.delete(p));
    }
    if (inFlight.size) await Promise.race(inFlight);
  }
  return errors;
}

async function writeManifest() {
  const manifestPath = path.join(ROOT, "public", "sneakers", "library.json");
  const manifest = designs.map((d) => ({
    slug: d.slug,
    name: d.name,
    creator: d.creator,
    modelName: d.modelName,
    paletteName: d.paletteName,
    materialName: d.materialName,
    basePrice: d.basePrice,
    badge: d.badge,
    tagline: d.tagline,
    image: `/sneakers/${d.slug}.png`,
  }));
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ wrote ${manifestPath} (${manifest.length} designs)`);
}

async function main() {
  await mkdir(path.join(ROOT, "public", "sneakers"), { recursive: true });
  console.log(`Model: ${MODEL} · Concurrency: ${CONCURRENCY} · Designs: ${designs.length}\n`);
  const errors = await pool(designs, generate, CONCURRENCY);
  await writeManifest();
  console.log(`\nDone. ${designs.length - errors.length}/${designs.length} successful.`);
  if (errors.length) console.log(`Re-run to retry failed slugs (existing files are skipped).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
