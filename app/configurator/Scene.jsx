"use client";

import React, { useEffect, useRef } from "react";

// Google's <model-viewer> web component: premium drag-rotate, scroll-zoom,
// auto-rotate, soft shadows, AR, native KHR_materials_variants switching, and
// per-material recolor + tap-picking. Loaded from CDN as a module so it
// self-registers with no npm peer-dependency or React-internals coupling.
const MV_SRC = "https://unpkg.com/@google/model-viewer@4.2.0/dist/model-viewer.min.js";

function ensureModelViewer() {
  if (typeof window === "undefined") return;
  if (window.customElements?.get("model-viewer")) return;
  if (document.querySelector(`script[data-mv]`)) return;
  const s = document.createElement("script");
  s.type = "module";
  s.src = MV_SRC;
  s.setAttribute("data-mv", "1");
  document.head.appendChild(s);
}

const hexToRgb = (h) => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

export default function Scene({ model, variant, paint, spin, onSpinStop, onVariants, onPickZone }) {
  const ref = useRef(null);
  const disp = useRef({}); // currently displayed hex per zone (for tweening)

  useEffect(() => { ensureModelViewer(); }, []);

  // Apply per-zone colours instantly (no tween) — used on first load.
  const applyPaintInstant = (p) => {
    const el = ref.current;
    if (!el || model.type !== "zone" || !p || !el.model) return;
    for (const mat of el.model.materials) {
      const zone = model.zones?.[mat.name];
      if (zone && p[zone]) {
        mat.pbrMetallicRoughness.setBaseColorFactor([...hexToRgb(p[zone]), 1]);
        disp.current[zone] = p[zone];
      }
    }
  };

  // Report baked colourways; apply zone defaults once the model is ready.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onLoad = () => {
      const v = el.availableVariants;
      if (v && v.length) onVariants?.(Array.from(v));
      else onVariants?.([]);
      applyPaintInstant(paint);
    };
    if (el.loaded) onLoad();
    el.addEventListener("load", onLoad);
    return () => el.removeEventListener("load", onLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onVariants, model]);

  // Variant models: swap the whole material set to the chosen baked colourway.
  useEffect(() => {
    const el = ref.current;
    if (el && model.type === "variant" && variant != null) el.variantName = variant;
  }, [variant, model.type]);

  // Zone models: tween each named material slot toward its target colour.
  useEffect(() => {
    const el = ref.current;
    if (!el || model.type !== "zone" || !paint || !el.model) return;
    let raf;
    const t0 = performance.now();
    const dur = 220;
    const from = {}, to = {};
    for (const mat of el.model.materials) {
      const zone = model.zones?.[mat.name];
      if (!zone || !paint[zone]) continue;
      from[mat.name] = hexToRgb(disp.current[zone] || paint[zone]);
      to[mat.name] = hexToRgb(paint[zone]);
    }
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      for (const mat of el.model.materials) {
        const f = from[mat.name], tt = to[mat.name];
        if (!f || !tt) continue;
        mat.pbrMetallicRoughness.setBaseColorFactor([
          f[0] + (tt[0] - f[0]) * t,
          f[1] + (tt[1] - f[1]) * t,
          f[2] + (tt[2] - f[2]) * t,
          1,
        ]);
      }
      if (t < 1) raf = requestAnimationFrame(tick);
      else for (const z in paint) disp.current[z] = paint[z];
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paint, model]);

  // Tap a zone directly on the 3D shoe.
  useEffect(() => {
    const el = ref.current;
    if (!el || model.type !== "zone" || !onPickZone) return;
    const onClick = (e) => {
      if (typeof el.materialFromPoint !== "function") return;
      const rect = el.getBoundingClientRect();
      try {
        const mat = el.materialFromPoint(e.clientX - rect.left, e.clientY - rect.top);
        const zone = mat && model.zones?.[mat.name];
        if (zone) onPickZone(zone);
      } catch { /* picking unsupported — chips still work */ }
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [model, onPickZone]);

  // Pause/resume auto-rotate without remounting.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (spin) el.setAttribute("auto-rotate", "");
    else el.removeAttribute("auto-rotate");
  }, [spin]);

  return (
    <model-viewer
      ref={ref}
      key={model.url}
      src={model.url}
      camera-controls=""
      auto-rotate=""
      auto-rotate-delay="0"
      rotation-per-second="22deg"
      interaction-prompt="none"
      shadow-intensity="1.1"
      shadow-softness="0.9"
      exposure="1.05"
      environment-image="neutral"
      camera-orbit="35deg 78deg 1.6m"
      min-camera-orbit="auto auto 0.4m"
      max-camera-orbit="auto auto 3m"
      onPointerDown={onSpinStop}
      style={{ width: "100%", height: "100%", backgroundColor: "#efe7db" }}
    />
  );
}
