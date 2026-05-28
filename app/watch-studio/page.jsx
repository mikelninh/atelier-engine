"use client";

import React, { useMemo, useState } from "react";
import Nav from "../Nav";
import { BRAND, CONFIG_GROUPS, DEFAULT_SELECTION, getOption, totalEur, assemblePrompt, bakedImage, buildSpecs } from "@/lib/satoriCatalog";

// Showcase the catalogue with a baked variant on first load (Apple shows a
// mid-spec hero, not the cheapest blank). Steel + Meteorite has a real photo.
const SHOWCASE = { ...DEFAULT_SELECTION, dial: "meteorite" };
const EDITION = { drop: "001", number: 27, total: 50 };

// Apple-style configurator: ONE strong base, simple modular add-ons with
// transparent price deltas, one big render, one persistent CTA. The Mac-config
// pattern. Constrained freedom — the catalogue lives in lib/satoriCatalog.js.

function formatDelta(d) {
  if (d === 0) return "incl.";
  if (d > 0) return `+€${d}`;
  return `−€${Math.abs(d)}`;
}

export default function WatchConfigurator() {
  const [selection, setSelection] = useState(SHOWCASE);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [intention, setIntention] = useState("");
  const [image, setImage] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(null);
  const [reserved, setReserved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyMidjourney() {
    const mj = `${prompt} --ar 1:1 --style raw --v 6.1`;
    try { await navigator.clipboard.writeText(mj); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }

  const total = totalEur(selection);
  const prompt = useMemo(() => assemblePrompt(selection), [selection]);
  const baked = useMemo(() => bakedImage(selection), [selection]);
  const hero = image || baked;
  const specs = useMemo(() => buildSpecs(selection), [selection]);

  function pick(groupId, optionId) {
    setSelection((s) => ({ ...s, [groupId]: optionId }));
  }

  async function render() {
    if (rendering) return;
    setRendering(true); setError(null); setImage(null);
    try {
      const res = await fetch("/api/generate-sneaker", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "free", productType: "watch", rawPrompt: prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
      setImage(json.image);
    } catch (e) {
      setError(e.message);
    } finally {
      setRendering(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#191714]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">
        <Nav />

        <header className="mb-8 mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#9b8066]">{BRAND.name} · Configure</p>
            <h1 className="mt-1 font-serif text-4xl tracking-tight md:text-5xl">{BRAND.baseModelName}</h1>
            <p className="mt-1 text-sm text-[#6f665d]">{BRAND.tagline}</p>
          </div>
          <p className="text-[11px] text-[#9b8066]">Made-to-order · ships in 8–12 weeks</p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
          {/* LEFT — hero render */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#0f1012] to-[#1a1c1f] shadow-2xl shadow-black/30">
              {hero ? (
                <img src={hero} alt="watch render" className="h-full w-full object-cover" />
              ) : (
                <div className="px-10 text-center">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">This build</p>
                  <p className="mt-3 font-serif text-2xl text-white/85">Not yet photographed.</p>
                  <p className="mt-2 text-xs text-white/50">Press “Render preview” to see your exact configuration.</p>
                </div>
              )}
              {rendering && <div className="absolute inset-0 grid place-items-center bg-black/40 text-sm text-white">Rendering on dark volcanic stone…</div>}

              {/* Edition badge */}
              <div className="absolute left-5 top-5 rounded-full bg-black/55 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/85 backdrop-blur">
                Drop {EDITION.drop} · No. {String(EDITION.number).padStart(3, "0")} / {EDITION.total}
              </div>
              {baked && !image && (
                <div className="absolute right-5 top-5 rounded-full bg-white/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/85 backdrop-blur">
                  studio photograph
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-[#9b8066]">free render · ~10s · powered by Flux</p>
              <div className="flex items-center gap-2">
                <button onClick={copyMidjourney}
                  className="rounded-full border border-black/15 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#191714] transition hover:bg-white">
                  {copied ? "Copied ✓" : "Copy MJ prompt"}
                </button>
                <button onClick={render} disabled={rendering}
                  className="rounded-full border border-[#191714] px-5 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#191714] transition hover:bg-[#191714] hover:text-white disabled:opacity-50">
                  {rendering ? "Rendering…" : "Render preview"}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — option groups */}
          <div className="flex flex-col gap-7">
            {CONFIG_GROUPS.map((group) => (
              <section key={group.id}>
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#786f64]">{group.label}</p>
                  <p className="text-[11px] text-[#b3a795]">{group.helper}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.options.map((opt) => {
                    const active = selection[group.id] === opt.id;
                    return (
                      <button key={opt.id} onClick={() => pick(group.id, opt.id)}
                        className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${active ? "border-[#191714] bg-white shadow-lg shadow-black/[0.04]" : "border-black/10 bg-white/60 hover:bg-white hover:border-black/20"}`}>
                        <span className="h-10 w-10 shrink-0 rounded-xl border border-black/10 shadow-inner"
                          style={{ background: opt.tone || "#cfd3d8" }} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-[#191714]">{opt.label}</span>
                          {opt.note && <span className="block text-[11px] leading-tight text-[#9b8066]">{opt.note}</span>}
                        </span>
                        <span className={`text-[12px] tabular-nums ${opt.delta === 0 ? "text-[#b3a795]" : opt.delta > 0 ? "text-[#191714]" : "text-emerald-700"}`}>
                          {formatDelta(opt.delta)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {group.id === "engraving" && selection.engraving === "intention" && (
                  <input value={intention} onChange={(e) => setIntention(e.target.value.slice(0, 28))}
                    placeholder="your intention · max 28 chars"
                    className="mt-3 w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm italic text-[#191714] placeholder:text-[#b3a795]" />
                )}
              </section>
            ))}

            {/* Apple-style build summary: per-line items + subtotal + CTA */}
            <div className="mt-3 rounded-[1.6rem] border border-black/10 bg-white p-5 shadow-xl shadow-black/[0.06]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#9b8066]">Your build</p>
              <ul className="mt-3 divide-y divide-black/5 text-sm">
                <li className="flex items-baseline justify-between py-2">
                  <span className="text-[#6f665d]">{BRAND.baseModelName} <span className="text-[11px] text-[#b3a795]">· base</span></span>
                  <span className="tabular-nums text-[#191714]">€{BRAND.basePriceEur}</span>
                </li>
                {CONFIG_GROUPS.map((g) => {
                  const o = getOption(g.id, selection[g.id]);
                  return (
                    <li key={g.id} className="flex items-baseline justify-between py-2">
                      <span className="text-[#6f665d]">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-[#b3a795]">{g.label} </span>
                        {o.label}
                      </span>
                      <span className={`tabular-nums ${o.delta === 0 ? "text-[#b3a795]" : o.delta > 0 ? "text-[#191714]" : "text-emerald-700"}`}>
                        {formatDelta(o.delta)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex items-baseline justify-between border-t border-black/10 pt-3">
                <span className="text-xs uppercase tracking-[0.18em] text-[#786f64]">Total</span>
                <span className="font-serif text-4xl tabular-nums">€{total}</span>
              </div>
              <button onClick={() => setReserved(true)} disabled={reserved}
                className="mt-4 w-full rounded-2xl bg-[#191714] px-6 py-4 text-sm font-medium uppercase tracking-[0.18em] text-white transition hover:bg-[#302d28] disabled:opacity-60">
                {reserved ? "Reserved · we’ll be in touch" : "Reserve in next drop →"}
              </button>
              <p className="mt-2 text-center text-[10px] text-[#9b8066]">Refundable €49 deposit · production starts when the drop fills</p>
            </div>

            {/* Tech Specs accordion */}
            <div className="rounded-[1.6rem] border border-black/10 bg-white/70 p-5">
              <button onClick={() => setSpecsOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
                <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#786f64]">Tech specs</span>
                <span className="text-sm text-[#9b8066]">{specsOpen ? "−" : "+"}</span>
              </button>
              {specsOpen && (
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  {specs.map((s) => (
                    <div key={s.label} className="rounded-xl bg-[#f6f1ea] p-3">
                      <dt className="text-[10px] uppercase tracking-[0.18em] text-[#9b8066]">{s.label}</dt>
                      <dd className="mt-0.5 text-[13px] text-[#191714]">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          </div>
        </div>

        {/* Brand atmosphere — the why */}
        <section className="mt-20 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#9b8066]">The house</p>
            <h2 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">A watch is a daily ritual.</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#4f483f]">
              {BRAND.name} builds integrated-bracelet sports watches in the spirit of the masters,
              with a dial that carries something larger than time — a starfield, a temple
              circuit, a meteorite older than us. Made-to-order in small drops. Engraved with
              an intention that belongs only to you.
            </p>
            <p className="mt-4 text-xs italic text-[#9b8066]">“Move in rhythm with the invisible.”</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img src="/watches/satori/steel-meteorite-bracelet.png" alt="Meteorite on lava" className="aspect-square w-full rounded-2xl object-cover" />
            <img src="/watches/satori/blackpvd-templeblack-bracelet.png" alt="Temple Circuit on coal" className="aspect-square w-full rounded-2xl object-cover" />
          </div>
        </section>
      </div>
    </div>
  );
}
