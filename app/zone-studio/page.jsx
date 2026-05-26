"use client";

import React, { useMemo, useState } from "react";
import { buildUserPrompt, getSilhouette, ZONE_LABELS } from "@/lib/sneakerPrompt";
import Nav from "../Nav";

// Named footwear colours: label feeds the prompt (a designer's colourway names
// colours, not hex), hex paints the instant SVG preview.
const NAMED_COLORS = [
  { label: "soft off-white pearl", hex: "#E9E4D8" },
  { label: "off-white waxed", hex: "#EDE7DA" },
  { label: "cream foam", hex: "#F2EADB" },
  { label: "ivory", hex: "#F4EFE4" },
  { label: "warm sand-beige", hex: "#D8BFA0" },
  { label: "tan suede", hex: "#B67633" },
  { label: "soft cocoa brown", hex: "#6E5742" },
  { label: "gum amber rubber", hex: "#C8924A" },
  { label: "deep forest green", hex: "#173F32" },
  { label: "olive drab", hex: "#5A5A33" },
  { label: "cobalt blue", hex: "#2F5EA8" },
  { label: "midnight navy", hex: "#1E2A44" },
  { label: "crimson red", hex: "#9E2B25" },
  { label: "pastel pink", hex: "#E9C6CF" },
  { label: "dark slate grey", hex: "#2A3340" },
  { label: "deep charcoal", hex: "#282521" },
  { label: "matte obsidian black", hex: "#14151A" },
];
const HEX = Object.fromEntries(NAMED_COLORS.map((c) => [c.label, c.hex]));

// Per-zone starting colourway (in label form). Silhouette decides which zones
// actually show; the rest are ignored.
const START = {
  base: "deep forest green",
  overlay: "tan suede",
  toe: "tan suede",
  eyestay: "deep forest green",
  tongue: "deep forest green",
  collar: "deep forest green",
  heelTab: "tan suede",
  midsole: "cream foam",
  outsole: "gum amber rubber",
  laces: "off-white waxed",
  stitching: "deep charcoal",
};

const SILHOUETTE_NAMES = ["Court Heritage", "Aeris Flow", "Future Slip", "Trailforge X"];
// Real material library with spec-backed attributes — designers asked for
// honest, sourceable materials, not invented ones. (Eco notes are ranges, not
// hero claims.)
const MATERIALS = [
  { name: "Cloud Suede", finish: "matte nap", composition: "premium bovine suede", eco: "durable, repairable" },
  { name: "Pearl Knit", finish: "matte weave", composition: "recycled poly engineered knit", eco: "~60% recycled content" },
  { name: "Bio Leather", finish: "satin grain", composition: "plant-based (cactus/grape) leather alt", eco: "bio-based, lower-impact" },
  { name: "Carbon Mesh", finish: "low-sheen", composition: "engineered mesh + TPU overlays", eco: "performance, mono-material upper" },
];
const MATERIAL_BY_NAME = Object.fromEntries(MATERIALS.map((m) => [m.name, m]));
const MOODS = ["Luxury Minimalist", "Street Ritual", "Performance Beast", "Collector Grail"];

// Stylised low-top profile (toe at left). Each zone is a path keyed by zone id
// so a tap selects it and the fill updates live. Drawn order = paint order.
function SneakerSVG({ colors, selected, onSelect }) {
  const fill = (z) => HEX[colors[z]] || "#ddd";
  const zoneProps = (z) => ({
    fill: fill(z),
    onClick: () => onSelect(z),
    className: "cursor-pointer transition-[stroke] duration-150",
    stroke: selected === z ? "#191714" : "rgba(0,0,0,0.12)",
    strokeWidth: selected === z ? 2.4 : 0.8,
  });
  return (
    <svg viewBox="0 0 440 230" className="w-full" role="img" aria-label="Editable sneaker zones">
      {/* ground shadow */}
      <ellipse cx="225" cy="214" rx="200" ry="9" fill="rgba(0,0,0,0.06)" />
      {/* outsole */}
      <path {...zoneProps("outsole")} d="M28,188 C16,190 16,204 32,206 L404,206 C418,206 420,190 408,187 C300,180 120,180 28,188 Z" />
      {/* midsole */}
      <path {...zoneProps("midsole")} d="M32,187 C120,180 300,180 408,187 L404,166 C300,159 120,159 34,166 Z" />
      {/* base upper */}
      <path {...zoneProps("base")} d="M34,166 C36,150 40,118 78,104 C120,90 168,86 222,88 L312,92 C356,98 388,124 400,160 L408,166 C300,159 120,159 34,166 Z" />
      {/* toe cap (left front) */}
      <path {...zoneProps("toe")} d="M34,166 C36,142 44,118 76,106 C92,120 100,144 102,166 Z" />
      {/* side overlay */}
      <path {...zoneProps("overlay")} d="M126,164 C126,132 148,112 186,110 C214,108 230,122 230,164 Z" />
      {/* eyestay / lace panel */}
      <path {...zoneProps("eyestay")} d="M236,112 L318,94 C342,108 346,132 340,162 L262,162 C246,150 240,130 236,112 Z" />
      {/* tongue */}
      <path {...zoneProps("tongue")} d="M214,108 L246,102 L252,80 L222,80 Z" />
      {/* collar */}
      <path {...zoneProps("collar")} d="M312,94 C346,84 380,94 394,120 C380,116 358,112 338,118 C326,104 318,98 312,94 Z" />
      {/* heel tab */}
      <path {...zoneProps("heelTab")} d="M394,120 C410,128 416,146 412,164 L388,164 C386,144 388,132 394,120 Z" />
      {/* laces */}
      <g onClick={() => onSelect("laces")} className="cursor-pointer">
        {[0, 1, 2].map((i) => (
          <line key={i}
            x1={252 + i * 26} y1={150 - i * 12} x2={300 + i * 18} y2={118 - i * 8}
            stroke={HEX[colors.laces] || "#fff"}
            strokeWidth={selected === "laces" ? 7 : 5} strokeLinecap="round"
          />
        ))}
      </g>
    </svg>
  );
}

function Card({ children, className = "" }) {
  return <div className={`rounded-[1.6rem] border border-black/5 bg-white/70 shadow-xl shadow-black/[0.04] ${className}`}>{children}</div>;
}

function LockIcon({ locked, className = "h-3 w-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      {locked ? <path d="M8 11V8a4 4 0 0 1 8 0v3" /> : <path d="M8 11V8a4 4 0 0 1 7-2.6" />}
    </svg>
  );
}

export default function ZoneStudio() {
  const [modelName, setModelName] = useState("Court Heritage");
  const [materialName, setMaterialName] = useState("Cloud Suede");
  const [aiMode, setAiMode] = useState("Luxury Minimalist");
  const [signatureFeature, setSignatureFeature] = useState("");
  const [colors, setColors] = useState(START);
  const [selected, setSelected] = useState("base");

  const [generating, setGenerating] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);

  const [reactions, setReactions] = useState(null);
  const [reacting, setReacting] = useState(false);

  // Designer feedback features.
  const [locked, setLocked] = useState({});   // zone -> bool (AI won't touch locked zones)
  const [story, setStory] = useState("");      // the drop's story (streetwear ask)
  const [review, setReview] = useState(null);  // designer-panel rating
  const [reviewing, setReviewing] = useState(false);

  const zones = getSilhouette(modelName).zones;
  const material = MATERIAL_BY_NAME[materialName];

  function toggleLock(z) {
    setLocked((l) => ({ ...l, [z]: !l[z] }));
  }

  // "AI is the intern": propose colours only for UNLOCKED zones; locked stay.
  function proposeColors() {
    setColors((c) => {
      const next = { ...c };
      for (const z of zones) {
        if (locked[z]) continue;
        next[z] = NAMED_COLORS[Math.floor(Math.random() * NAMED_COLORS.length)].label;
      }
      return next;
    });
  }

  // Buildable spec export (tech-pack ask): silhouette + material spec + named
  // colourway per zone + story + signature, as a downloadable JSON.
  function exportTechPack() {
    const pack = {
      silhouette: modelName,
      mood: aiMode,
      material: { name: materialName, ...material },
      story: story || null,
      signatureFeature: signatureFeature || null,
      colourway: Object.fromEntries(zones.map((z) => [ZONE_LABELS[z] || z, colors[z]])),
      promptSpec: prompt,
    };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${modelName.replace(/\s+/g, "-").toLowerCase()}-techpack.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runDesignerReview() {
    if (reviewing) return;
    setReviewing(true);
    setReview(null);
    try {
      const res = await fetch("/api/designer-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName, materialName, aiMode, signatureFeature, story, colorway: colors }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
      setReview(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setReviewing(false);
    }
  }

  const prompt = useMemo(
    () => buildUserPrompt({ modelName, paletteName: "Forest Gum", materialName, aiMode, signatureFeature, colorway: colors }),
    [modelName, materialName, aiMode, signatureFeature, colors]
  );

  function paint(label) {
    setColors((c) => ({ ...c, [selected]: label }));
  }

  async function askPanel() {
    if (reacting) return;
    setReacting(true);
    setReactions(null);
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName, paletteName: "Forest Gum", materialName, aiMode, signatureFeature, colorway: colors }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
      setReactions(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setReacting(false);
    }
  }

  async function generate() {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-sneaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName, paletteName: "Forest Gum", materialName, aiMode, signatureFeature, colorway: colors }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
      setImage(json.image);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5efe7] p-4 text-[#191714] md:p-6">
      <div className="mx-auto max-w-[1500px]">
        <Nav />
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[#786f64]">Atelier Engine · Zone Studio</p>
          <h1 className="font-serif text-3xl">Paint the sneaker zone by zone</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6f665d]">Tap a zone, pick a colour — preview and prompt update instantly and for free. Render the real photo only when you like it.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          {/* LEFT — live SVG + zone picker */}
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap gap-1.5">
              {SILHOUETTE_NAMES.map((m) => (
                <button key={m} onClick={() => { setModelName(m); setSelected("base"); }}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${modelName === m ? "border-[#191714] bg-[#191714] text-white" : "border-black/10 bg-white/70 hover:bg-white"}`}>{m}</button>
              ))}
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#f4ece3] to-[#e8ded2] p-3">
              <SneakerSVG colors={colors} selected={selected} onSelect={setSelected} />
            </div>

            <div className="mb-2 mt-4 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">Zones · lock what you love</p>
              <button onClick={proposeColors} className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] hover:bg-white" title="AI recolours only the unlocked zones">
                Propose colours →
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {zones.map((z) => (
                <div key={z}
                  className={`flex items-center gap-1 rounded-full border py-1 pl-2.5 pr-1 text-xs transition ${selected === z ? "border-[#191714] bg-white" : "border-black/10 bg-white/60"}`}>
                  <button onClick={() => setSelected(z)} className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: HEX[colors[z]] }} />
                    {ZONE_LABELS[z]}
                  </button>
                  <button onClick={() => toggleLock(z)} title={locked[z] ? "locked — AI won't touch it" : "unlocked"}
                    className={`grid h-5 w-5 place-items-center rounded-full transition ${locked[z] ? "bg-[#191714] text-white" : "text-[#b3a795] hover:bg-[#f4ece3]"}`}>
                    <LockIcon locked={locked[z]} />
                  </button>
                </div>
              ))}
            </div>

            <p className="mb-2 mt-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">
              Colour for <span className="text-[#191714]">{ZONE_LABELS[selected]}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {NAMED_COLORS.map((c) => (
                <button key={c.label} onClick={() => paint(c.label)} title={c.label}
                  className={`h-8 w-8 rounded-lg border-2 transition ${colors[selected] === c.label ? "border-[#191714] scale-110" : "border-black/10 hover:scale-105"}`}
                  style={{ background: c.hex }} />
              ))}
            </div>
          </Card>

          {/* MIDDLE — live prompt + controls */}
          <Card className="flex flex-col p-5">
            <div className="mb-3 grid grid-cols-1 gap-3">
              <label className="text-xs text-[#786f64]">Upper material
                <select value={materialName} onChange={(e) => setMaterialName(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-[#191714]">
                  {MATERIALS.map((m) => <option key={m.name}>{m.name}</option>)}
                </select>
                {material && (
                  <span className="mt-1 block text-[11px] leading-snug text-[#9b8066]">{material.composition} · {material.finish} · {material.eco}</span>
                )}
              </label>
              <label className="text-xs text-[#786f64]">Mood
                <select value={aiMode} onChange={(e) => setAiMode(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-[#191714]">
                  {MOODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
              <label className="text-xs text-[#786f64]">Signature detail (one iconic feature)
                <input value={signatureFeature} onChange={(e) => setSignatureFeature(e.target.value)} placeholder="e.g. a dynamic side panel suggesting upward flight"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-[#191714]" />
              </label>
              <label className="text-xs text-[#786f64]">Drop story
                <input value={story} onChange={(e) => setStory(e.target.value)} placeholder="the why behind this drop — carries into the spec"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-[#191714]" />
              </label>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">Tech-pack spec</p>
              <button onClick={exportTechPack} className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] hover:bg-white">Export JSON ↓</button>
            </div>
            <pre className="flex-1 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#191714] p-4 text-[11px] leading-relaxed text-[#e9e4d8]">{prompt}</pre>
          </Card>

          {/* RIGHT — on-demand real render */}
          <Card className="flex flex-col p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">Real render</p>
              <span className="text-[11px] text-[#9b8066]">~7s · €0.005</span>
            </div>
            <div className="relative mb-4 grid aspect-square place-items-center overflow-hidden rounded-2xl bg-[#f6f1ea]">
              {image ? <img src={image} alt="rendered sneaker" className="h-full w-full object-cover" />
                : <p className="px-6 text-center text-sm text-[#9b8066]">Compose for free on the left, then render the real photo here.</p>}
              {generating && <div className="absolute inset-0 grid place-items-center bg-white/60 text-sm">Drafting your sneaker…</div>}
            </div>
            {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <button onClick={generate} disabled={generating}
              className="rounded-2xl bg-[#191714] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#302d28] disabled:opacity-50">
              {generating ? "Generating…" : "Generate real render"}
            </button>
          </Card>
        </div>

        {/* Hype Check — a panel of personas reacts to the design */}
        <Card className="mt-5 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">Hype Check</p>
              <h2 className="text-lg font-semibold">Would the room cop it?</h2>
              <p className="text-xs text-[#786f64]">A panel of sneaker-world archetypes reacts to your design. A taste signal, not market research.</p>
            </div>
            <div className="flex items-center gap-3">
              {reactions && (
                <span className="rounded-full bg-[#eadfd2] px-3 py-1.5 text-sm font-semibold">{reactions.copCount}/{reactions.total} would cop</span>
              )}
              <button onClick={askPanel} disabled={reacting}
                className="rounded-2xl bg-[#191714] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#302d28] disabled:opacity-50">
                {reacting ? "Asking the panel…" : "Ask the panel"}
              </button>
            </div>
          </div>
          {reactions && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {reactions.reactions.map((r) => {
                const tone = { love: "bg-green-50 text-green-800", like: "bg-emerald-50 text-emerald-700", meh: "bg-[#f4ece3] text-[#7b5d43]", pass: "bg-red-50 text-red-700" }[r.verdict] || "bg-[#f4ece3]";
                return (
                  <div key={r.id} className="flex flex-col rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{r.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tone}`}>{r.verdict}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#9b8066]">{r.role}</p>
                    <p className="mt-2 flex-1 text-sm leading-snug text-[#191714]">“{r.quote}”</p>
                    {r.improvement && <p className="mt-2 border-t border-black/5 pt-2 text-[11px] text-[#786f64]">↳ {r.improvement}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Designer Review — the four designers we interviewed rate the output */}
        <Card className="mt-5 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">Designer Review</p>
              <h2 className="text-lg font-semibold">Does it meet what designers asked for?</h2>
              <p className="text-xs text-[#786f64]">The four designers we interviewed rate this design against the needs they each stated.</p>
            </div>
            <div className="flex items-center gap-3">
              {review && (
                <span className="rounded-full bg-[#eadfd2] px-3 py-1.5 text-sm font-semibold">avg {review.avg}/10</span>
              )}
              <button onClick={runDesignerReview} disabled={reviewing}
                className="rounded-2xl bg-[#191714] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#302d28] disabled:opacity-50">
                {reviewing ? "Reviewing…" : "Run designer review"}
              </button>
            </div>
          </div>
          {review && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {review.reviews.map((r) => {
                const tone = r.score >= 8 ? "bg-green-50 text-green-800" : r.score >= 6 ? "bg-emerald-50 text-emerald-700" : r.score >= 4 ? "bg-[#f4ece3] text-[#7b5d43]" : "bg-red-50 text-red-700";
                return (
                  <div key={r.id} className="flex flex-col rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{r.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{r.score}/10</span>
                    </div>
                    <p className="mt-2 flex-1 text-sm leading-snug text-[#191714]">“{r.verdict}”</p>
                    {r.unmet && <p className="mt-2 border-t border-black/5 pt-2 text-[11px] text-[#786f64]">Still missing: {r.unmet}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
