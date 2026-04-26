#!/usr/bin/env node
/**
 * One-off: regenerate court-heritage on two models with a hardened prompt.
 * Compares google/gemini-2.5-flash-image vs google/gemini-3-pro-image-preview.
 * Saves to public/sneakers/_compare/ so the live App.jsx is untouched until
 * we pick a winner.
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
if (!apiKey) {
  console.error("OPENROUTER_API_KEY not set.");
  process.exit(1);
}

const SYSTEM_PROMPT = `You are a product photographer for an editorial sneaker design house.

ABSOLUTE RULES — violating any one means the image is unusable:
- The sneaker must be brand-neutral and generic. No real-world brand logo of any kind.
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
- High detail on stitching, leather grain, and rubber sole texture.`;

const USER_PROMPT = `A low-top retro court-style sneaker, brand-neutral and entirely generic.

Silhouette: classic court low-top, slim profile, suede toe-box, leather upper, gum rubber cup-sole.

Colour and material:
- Upper: deep forest green smooth bio-leather.
- Side panel: a single PLAIN cream/off-white leather panel — completely smooth, no stripes, no logo, no perforations, no decoration of any kind.
- Toe-box: tan suede with subtle perforation pattern only on the toe (NOT the side panel).
- Laces: flat waxed cream laces.
- Sole: classic gum rubber cup-sole, light amber brown.
- Heel tab: small plain green leather pull tab, no text.
- Tongue: plain green leather tongue, no logo, no label.

Composition: studio product photography, three-quarter front angle, single sneaker on a soft warm-cream fabric backdrop, soft natural light from upper left, gentle ground shadow. Square 1:1 crop, high resolution, editorial.`;

const MODELS = [
  "google/gemini-2.5-flash-image",
  "google/gemini-3-pro-image-preview",
];

async function generate(model) {
  const slug = model.replace(/^google\//, "").replace(/[/]/g, "_");
  console.log(`\n→ ${slug}`);
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
      model,
      modalities: ["image", "text"],
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: USER_PROMPT },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 500)}`);
  }
  const json = await res.json();
  const msg = json.choices?.[0]?.message;
  const imageUrl = msg?.images?.[0]?.image_url?.url;
  if (!imageUrl) throw new Error(`No image: ${JSON.stringify(json).slice(0, 400)}`);
  const b64 = imageUrl.split(",", 2)[1];
  const outDir = path.join(ROOT, "public", "sneakers", "_compare");
  await mkdir(outDir, { recursive: true });
  const out = path.join(outDir, `court-heritage.${slug}.png`);
  await writeFile(out, Buffer.from(b64, "base64"));
  console.log(`   saved ${out} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return out;
}

for (const model of MODELS) {
  try {
    await generate(model);
  } catch (e) {
    console.error(`   failed: ${e.message}`);
  }
}
console.log("\nCompare files in public/sneakers/_compare/");
