#!/usr/bin/env node
/**
 * Generate the four hero sneaker images via OpenRouter (Gemini 2.5 Flash Image),
 * save them to public/sneakers/, then patch src/App.jsx to point at
 * the local PNG paths instead of the placehold.co fallbacks.
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-... node scripts/generate-sneaker-images.mjs
 *   # or:
 *   node scripts/generate-sneaker-images.mjs   # reads .env.local
 *
 * Each prompt is hand-tuned to the design's archetype + palette so the
 * generated images match the dashboard's brand language: Hara-calm,
 * product-photography, neutral backdrops, 1:1.
 */

import { writeFile, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// ---- env: prefer process.env, fall back to .env.local ----
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
  console.error("OPENROUTER_API_KEY not set. Put it in .env.local or export it.");
  process.exit(1);
}

const designs = [
  {
    slug: "aeris-flow",
    prompt: `Studio product photography of a chunky lifestyle running sneaker on a soft warm-cream backdrop.
Off-white pearl knit upper with subtle weave texture, dark charcoal accents on heel and tongue, chunky sculpted white midsole with subtle ridges, black rubber outsole.
Brand-neutral, no logos, no text. Clean New Balance / Asics aesthetic. Three-quarter angle.
Soft directional natural light from upper left, gentle shadow, no harsh reflections. Square crop. High detail. Editorial, calm, MUJI-inspired.`,
  },
  {
    slug: "court-heritage",
    prompt: `Studio product photography of a low-top retro court sneaker on a soft cream backdrop.
Bio-leather upper in deep forest green with cream/off-white panels, classic gum rubber sole, tan suede toe-box, perforated detail on side panels, slim profile.
Brand-neutral, no logos, no text. Adidas Samba / Nike Dunk Low silhouette inspiration. Three-quarter angle.
Soft directional natural light, editorial product photography style. Square crop. High detail. Calm, refined.`,
  },
  {
    slug: "future-slip",
    prompt: `Studio product photography of a futuristic comfort slip-on mule sneaker on a soft warm-sand backdrop.
Sand-beige cloud-suede upper with no laces, sculptural single-piece silhouette, deep dark charcoal sole with thick foam midsole.
Brand-neutral, no logos, no text. Recovery-mule / foam-runner aesthetic. Three-quarter angle.
Soft directional natural light, gentle shadow, editorial product photography. Square crop. High detail. Minimalist, calm.`,
  },
  {
    slug: "trailforge-x",
    prompt: `Studio product photography of a rugged performance trail running sneaker on a dark slate backdrop.
Carbon-mesh black upper with cobalt blue accents on overlays and laces, aggressive chunky lugged outsole in dark grey, technical synthetic detailing, slim heel cup.
Brand-neutral, no logos, no text. Salomon / techwear-trail aesthetic. Three-quarter angle.
Dramatic but soft directional lighting from upper left. Square crop. High detail. Editorial, technical, refined.`,
  },
];

const MODEL = process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image";

async function generate(design) {
  console.log(`\n→ ${design.slug}`);
  const t0 = Date.now();
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
      messages: [{ role: "user", content: design.prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 400)}`);
  }
  const json = await res.json();
  // Gemini-on-OpenRouter returns images in message.images[*].image_url.url as data URLs
  const msg = json.choices?.[0]?.message;
  const imageUrl = msg?.images?.[0]?.image_url?.url;
  if (!imageUrl) {
    throw new Error(`No image in response for ${design.slug}: ${JSON.stringify(json).slice(0, 300)}`);
  }
  const b64 = imageUrl.startsWith("data:") ? imageUrl.split(",", 2)[1] : null;
  if (!b64) throw new Error(`Unexpected image_url format for ${design.slug}`);
  const out = path.join(ROOT, "public", "sneakers", `${design.slug}.png`);
  await writeFile(out, Buffer.from(b64, "base64"));
  console.log(`   saved ${out} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return out;
}

async function patchAppJsx() {
  const appPath = path.join(ROOT, "src", "App.jsx");
  let src = await readFile(appPath, "utf8");
  const map = [
    { key: "minimalRunner", file: "aeris-flow.png",      pattern: /minimalRunner: ".*?"/ },
    { key: "retroCourt",    file: "court-heritage.png",  pattern: /retroCourt:\s*".*?"/ },
    { key: "futureMule",    file: "future-slip.png",     pattern: /futureMule:\s*".*?"/ },
    { key: "trailBeast",    file: "trailforge-x.png",    pattern: /trailBeast:\s*".*?"/ },
  ];
  let changed = 0;
  for (const { key, file, pattern } of map) {
    const abs = path.join(ROOT, "public", "sneakers", file);
    if (!existsSync(abs)) {
      console.log(`   skip ${key}: ${file} not generated`);
      continue;
    }
    if (pattern.test(src)) {
      src = src.replace(pattern, `${key}: "/sneakers/${file}"`);
      changed++;
    }
  }
  await writeFile(appPath, src);
  console.log(`\n✓ patched ${changed}/4 image paths in src/App.jsx`);
}

async function main() {
  console.log(`Model: ${MODEL} · Output: public/sneakers/`);
  for (const design of designs) {
    try {
      await generate(design);
    } catch (e) {
      console.error(`   failed: ${e.message}`);
    }
  }
  await patchAppJsx();
  console.log("\nDone. Reload http://localhost:5174 to see the new images.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
