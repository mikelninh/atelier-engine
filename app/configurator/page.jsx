"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Nav from "../Nav";
import { ZONE_LABELS } from "@/lib/sneakerPrompt";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-[#9b8066]">Loading 3D studio…</div>,
});

// ── Model registry (model-agnostic) ─────────────────────────────────────────
// `variant` models carry baked colourways (KHR_materials_variants). `zone`
// models expose per-part material slots painted live from a hex map.
const MODELS = {
  atelierRunner: {
    label: "Atelier Runner",
    url: "/models/atelier-runner.glb",
    type: "zone",
    basePrice: 229,
    attribution: "Atelier Engine original · CC0",
    // material name (in the GLB) → zone id. Generator names them identically.
    zones: { base: "base", toe: "toe", overlay: "overlay", eyestay: "eyestay", tongue: "tongue", collar: "collar", heelTab: "heelTab", midsole: "midsole", outsole: "outsole", laces: "laces" },
    defaults: { base: "#173F32", overlay: "#B67633", toe: "#B67633", eyestay: "#173F32", tongue: "#173F32", collar: "#173F32", heelTab: "#B67633", midsole: "#F2EADB", outsole: "#C8924A", laces: "#EDE7DA" },
  },
  studioRunner: {
    label: "Studio Runner",
    url: "/models/shoe.glb",
    type: "variant",
    basePrice: 219,
    attribution: "3D model © Shopify Inc., CC BY 4.0",
  },
};

const NAMED_COLORS = [
  { label: "off-white pearl", hex: "#E9E4D8" },
  { label: "tan suede", hex: "#B67633" },
  { label: "gum amber", hex: "#C8924A" },
  { label: "forest green", hex: "#173F32" },
  { label: "olive", hex: "#5A5A33" },
  { label: "cobalt blue", hex: "#2F5EA8" },
  { label: "crimson", hex: "#9E2B25" },
  { label: "pastel pink", hex: "#E9C6CF" },
  { label: "slate grey", hex: "#2A3340" },
  { label: "obsidian", hex: "#14151A" },
];

function Card({ children, className = "" }) {
  return <div className={`rounded-[1.6rem] border border-black/5 bg-white/70 shadow-xl shadow-black/[0.04] ${className}`}>{children}</div>;
}

const VARIANT_LABELS = { midnight: "Midnight", beach: "Beach", street: "Street" };

export default function Configurator() {
  const [modelKey, setModelKey] = useState("atelierRunner");
  const model = MODELS[modelKey];
  const isZone = model.type === "zone";

  const [spin, setSpin] = useState(true);
  const [variants, setVariants] = useState([]);
  const [variant, setVariant] = useState(null);
  const [paint, setPaint] = useState(model.defaults || {});
  const [zone, setZone] = useState(isZone ? Object.keys(model.zones)[0] : null);
  const [ordered, setOrdered] = useState(false);

  // Reset design state when switching models.
  useEffect(() => {
    setVariants([]); setVariant(null); setOrdered(false);
    setPaint(model.defaults || {});
    setZone(model.type === "zone" ? Object.keys(model.zones)[0] : null);
  }, [modelKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!variant && variants.length) setVariant(variants[0]); }, [variants, variant]);

  const onVariants = useMemo(() => (list) => setVariants(list), []);
  const onPickZone = useMemo(() => (z) => setZone(z), []);
  const price = model.basePrice + (isZone ? Object.keys(paint).length * 3 : 0);

  return (
    <div className="min-h-screen bg-[#f5efe7] p-4 text-[#191714] md:p-6">
      <div className="mx-auto max-w-[1500px]">
        <Nav />
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[#786f64]">Atelier Engine · 3D Configurator</p>
          <h1 className="font-serif text-3xl">See it. Design it. Order it.</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6f665d]">
            Drag to rotate · scroll to zoom{isZone ? " · tap a part of the shoe to select it, then pick a colour" : " · the shoe spins until you grab it"}.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Card className="relative overflow-hidden">
            <div className="h-[460px] md:h-[600px]">
              <Scene model={model} variant={variant} paint={paint} spin={spin}
                onSpinStop={() => setSpin(false)} onVariants={onVariants} onPickZone={onPickZone} />
            </div>
            <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <button onClick={() => setSpin((s) => !s)} className="pointer-events-auto rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-xs backdrop-blur hover:bg-white">
                {spin ? "Pause spin" : "Auto-rotate"}
              </button>
              <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] text-[#9b8066] backdrop-blur">{model.attribution}</span>
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="p-5">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">Silhouette</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {Object.entries(MODELS).map(([key, m]) => (
                  <button key={key} onClick={() => setModelKey(key)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${modelKey === key ? "border-[#191714] bg-[#191714] text-white" : "border-black/10 bg-white/70 hover:bg-white"}`}>
                    {m.label}
                  </button>
                ))}
              </div>

              {isZone ? (
                <>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">Zones</p>
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {Object.keys(model.zones).map((z) => (
                      <button key={z} onClick={() => setZone(z)}
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${zone === z ? "border-[#191714] bg-white" : "border-black/10 bg-white/60 hover:bg-white"}`}>
                        <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: paint[z] }} />
                        {ZONE_LABELS[z] || z}
                      </button>
                    ))}
                  </div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">
                    Colour for <span className="text-[#191714]">{ZONE_LABELS[zone] || zone}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {NAMED_COLORS.map((c) => (
                      <button key={c.hex} title={c.label} onClick={() => setPaint((p) => ({ ...p, [zone]: c.hex }))}
                        className={`h-9 w-9 rounded-lg border-2 transition ${paint[zone] === c.hex ? "border-[#191714] scale-110" : "border-black/10 hover:scale-105"}`}
                        style={{ background: c.hex }} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">Colourway</p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <button key={v} onClick={() => setVariant(v)}
                        className={`rounded-2xl border px-4 py-2.5 text-sm transition ${variant === v ? "border-[#191714] bg-[#191714] text-white" : "border-black/10 bg-white/70 hover:bg-white"}`}>
                        {VARIANT_LABELS[v] || v}
                      </button>
                    ))}
                    {variants.length === 0 && <span className="text-xs text-[#9b8066]">Loading colourways…</span>}
                  </div>
                </>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-[#786f64]">Made-to-order price</p>
                  <p className="text-3xl font-semibold">€{price}</p>
                </div>
                <div className="text-right text-xs text-[#786f64]">
                  <p>{model.label}</p>
                  <p>{isZone ? "custom colourway" : VARIANT_LABELS[variant] || variant}</p>
                </div>
              </div>
              <button onClick={() => setOrdered(true)}
                className="mt-4 w-full rounded-2xl bg-[#191714] px-5 py-4 text-sm font-medium text-white transition hover:bg-[#302d28]">
                Order this pair
              </button>
              {ordered && (
                <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-800">
                  Order captured (demo). Next: Stripe Checkout → made-to-order production.
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
