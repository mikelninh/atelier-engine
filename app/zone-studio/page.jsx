"use client";

import React, { useMemo, useState } from "react";
import { buildUserPrompt, getSilhouette, getZoneLabels } from "@/lib/productSpec";

const ZONE_LABELS = getZoneLabels("sneaker");
import Nav from "../Nav";
import { NAMED_COLORS, HEX, SneakerSVG, MATERIALS, MATERIAL_BY_NAME } from "../sneakerArt";

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
const MOODS = ["Luxury Minimalist", "Street Ritual", "Performance Beast", "Collector Grail"];

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

  // Publish as a shareable, numbered drop page (design encoded in the URL —
  // self-contained, no storage). Copies the link and opens the drop.
  function publishDrop() {
    const design = { m: modelName, mat: materialName, mood: aiMode, sig: signatureFeature, story, c: colors };
    const d = btoa(encodeURIComponent(JSON.stringify(design)));
    const url = `/drop?d=${d}`;
    try { navigator.clipboard?.writeText(window.location.origin + url); } catch {}
    window.open(url, "_blank");
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
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">Tech-pack spec</p>
              <div className="flex items-center gap-2">
                <button onClick={exportTechPack} className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] hover:bg-white">Export JSON ↓</button>
                <button onClick={publishDrop} className="rounded-full bg-[#191714] px-3 py-1 text-[11px] font-medium text-white hover:bg-[#302d28]">Publish drop ↗</button>
              </div>
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
