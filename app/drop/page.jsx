"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSilhouette, getZoneLabels } from "@/lib/productSpec";
import { HEX, SneakerSVG, MATERIAL_BY_NAME, dropIdentity } from "../sneakerArt";

const ZONE_LABELS = getZoneLabels("sneaker");

// A shareable, numbered drop. The whole design is encoded in the ?d= param, so
// the page is self-contained — no backend, the link IS the drop.
function decode(d) {
  try {
    return JSON.parse(decodeURIComponent(atob(d)));
  } catch {
    return null;
  }
}

export default function Drop() {
  const [encoded, setEncoded] = useState(null);
  const [reserved, setReserved] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("d");
    setEncoded(p);
  }, []);

  const design = useMemo(() => (encoded ? decode(encoded) : null), [encoded]);
  const id = useMemo(() => (encoded ? dropIdentity(encoded) : null), [encoded]);

  if (encoded === null) {
    return <Shell><p className="text-sm text-[#9b8066]">Loading drop…</p></Shell>;
  }
  if (!design) {
    return (
      <Shell>
        <p className="text-sm text-[#9b8066]">This drop link looks invalid.</p>
        <Link href="/zone-studio" className="mt-3 inline-block rounded-2xl bg-[#191714] px-5 py-3 text-sm text-white">Design one in the studio</Link>
      </Shell>
    );
  }

  const colors = design.c || {};
  const zones = getSilhouette("sneaker", design.m).zones;
  const material = MATERIAL_BY_NAME[design.mat];

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-gradient-to-br from-[#f4ece3] via-[#f8f4ee] to-[#e3d8c8] p-8 shadow-xl">
          <div className="mx-auto max-w-[560px]">
            <SneakerSVG colors={colors} />
          </div>
          <span className="absolute left-5 top-5 rounded-full bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#7b5d43] backdrop-blur">
            Edition {String(id.edition).padStart(3, "0")} / {id.editionSize}
          </span>
        </div>

        {/* Detail */}
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.22em] text-[#786f64]">Atelier Engine · Drop</p>
          <h1 className="mt-1 font-serif text-4xl leading-tight">{design.m}</h1>
          {design.mood && <p className="mt-1 text-sm text-[#9b8066]">{design.mood}</p>}
          {design.story && <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#4f483f]">“{design.story}”</p>}
          {design.sig && (
            <p className="mt-3 rounded-xl bg-[#f4ece3] px-3 py-2 text-xs text-[#7b5d43]">Signature detail · {design.sig}</p>
          )}

          {/* Colourway */}
          <p className="mb-2 mt-6 text-[11px] font-medium uppercase tracking-[0.18em] text-[#786f64]">Colourway</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {zones.filter((z) => colors[z]).map((z) => (
              <div key={z} className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: HEX[colors[z]] }} />
                <span className="text-[#786f64]">{ZONE_LABELS[z] || z}</span>
                <span className="ml-auto text-[#191714]">{colors[z]}</span>
              </div>
            ))}
          </div>

          {/* Material / provenance */}
          {material && (
            <p className="mt-5 text-sm"><span className="text-[#786f64]">Material · </span>{material.name} — {material.composition} · {material.eco}</p>
          )}
          <p className="mt-1 text-xs text-[#9b8066]">Made to order · numbered edition · Certificate {id.cert}</p>

          {/* Order */}
          <button onClick={() => setReserved(true)}
            className="mt-6 w-full rounded-2xl bg-[#191714] px-5 py-4 text-sm font-medium text-white transition hover:bg-[#302d28] sm:w-auto sm:px-10">
            Reserve this pair
          </button>
          {reserved && (
            <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-800">
              Reserved (demo). Next: Stripe Checkout → made-to-order. Your edition {String(id.edition).padStart(3, "0")} is held.
            </p>
          )}
          <Link href={`/zone-studio`} className="mt-4 text-xs text-[#9b8066] underline-offset-2 hover:underline">Remix this in the studio →</Link>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[#f5efe7] p-4 text-[#191714] md:p-8">
      <div className="mx-auto max-w-[1100px]">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/studio" className="font-serif text-xl tracking-[0.18em]">ATELIER ENGINE</Link>
          <Link href="/zone-studio" className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-sm hover:bg-white">Open studio</Link>
        </header>
        {children}
      </div>
    </div>
  );
}
