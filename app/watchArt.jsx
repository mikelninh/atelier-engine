// Shared watch art + colour data for the watch studio (and any future drop
// page), mirroring sneakerArt. A top-down stylised watch whose zones are
// painted live from a label→hex map, plus an honest price/BOM estimator.

export const NAMED_COLORS = [
  { label: "steel", hex: "#C2C7CC" },
  { label: "graphite", hex: "#3A3F45" },
  { label: "matte black", hex: "#1C1D1F" },
  { label: "space black", hex: "#0E0F12" },
  { label: "gold", hex: "#C9A95B" },
  { label: "slate blue", hex: "#2E4A7A" },
  { label: "emerald", hex: "#0E5A43" },
  { label: "crimson", hex: "#B0271F" },
  { label: "burnt orange", hex: "#C2622B" },
  { label: "sand cream", hex: "#E9DDBE" },
  { label: "warm cream", hex: "#EFE6D2" },
  { label: "lume green", hex: "#B6C9A0" },
  { label: "tan leather", hex: "#9A6B3F" },
  { label: "black leather", hex: "#1A1A1C" },
  { label: "ivory", hex: "#F1EAD8" },
];
export const HEX = Object.fromEntries(NAMED_COLORS.map((c) => [c.label, c.hex]));

// Case-material library (the studio's "material" select), spec-backed + honest.
export const MATERIALS = [
  { name: "Brushed Steel", finish: "matte brushed", composition: "316L stainless steel", eco: "recyclable, repairable" },
  { name: "Polished Gold", finish: "mirror polish", composition: "gold-tone PVD on steel", eco: "PVD, no solid gold" },
  { name: "Matte Titanium", finish: "sandblasted", composition: "grade-2 titanium", eco: "light, hypoallergenic" },
  { name: "Black PVD", finish: "matte coating", composition: "black-PVD-coated steel", eco: "scratch-resistant coating" },
];
export const MATERIAL_BY_NAME = Object.fromEntries(MATERIALS.map((m) => [m.name, m]));

// Honest price/BOM estimate. Factory = per-unit OEM cost at small batch (USD);
// retail = suggested launch price (EUR). Ranges, not quotes — a market signal.
const SILHOUETTE_TIER = {
  "Field Classic": { movement: "Automatic 3-hand (NH35-class)", factory: [55, 90], retail: [249, 349] },
  "Diver Pro": { movement: "Automatic diver (NH35-class)", factory: [70, 120], retail: [299, 449] },
  "Dress Slim": { movement: "Slim automatic", factory: [60, 100], retail: [279, 399] },
  "Chrono Sport": { movement: "Mechanical chronograph", factory: [90, 140], retail: [349, 549] },
};
const MATERIAL_ADD = {
  "Brushed Steel": { factory: [0, 0], retail: [0, 0] },
  "Polished Gold": { factory: [15, 40], retail: [60, 120] },
  "Matte Titanium": { factory: [20, 45], retail: [70, 130] },
  "Black PVD": { factory: [8, 20], retail: [30, 60] },
};

export function priceEstimate(silhouetteName, materialName) {
  const t = SILHOUETTE_TIER[silhouetteName] || SILHOUETTE_TIER["Field Classic"];
  const m = MATERIAL_ADD[materialName] || MATERIAL_ADD["Brushed Steel"];
  return {
    movement: t.movement,
    factory: [t.factory[0] + m.factory[0], t.factory[1] + m.factory[1]],
    retail: [t.retail[0] + m.retail[0], t.retail[1] + m.retail[1]],
  };
}

// Stylised top-down watch. Pass `onSelect` to make zones clickable (studio);
// omit it for a display-only hero.
// Lighten (pct>0) or darken (pct<0) a hex toward white/black — used to fake
// metallic linear gradients and a sunburst dial from a single zone colour.
function shade(hex, pct) {
  const h = (hex || "#cfd3d8").replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  let r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  const t = pct < 0 ? 0 : 255, p = Math.abs(pct) / 100;
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function WatchSVG({ colors, selected = null, onSelect, hasSubdial = false, hasSecondHand = true }) {
  const fill = (z) => HEX[colors[z]] || "#cfd3d8";
  const interactive = typeof onSelect === "function";
  const sel = (z) => ({
    onClick: interactive ? () => onSelect(z) : undefined,
    style: interactive ? { cursor: "pointer" } : undefined,
    stroke: selected === z ? "#191714" : "rgba(0,0,0,0.14)",
    strokeWidth: selected === z ? 2.5 : 0.75,
  });
  const cx = 120, cy = 162;
  const indices = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * 44, y: cy + Math.sin(a) * 44, big: i % 3 === 0 };
  });
  const caseC = fill("case"), bezelC = fill("bezel"), dialC = fill("dial"), strapC = fill("strap");

  return (
    <svg viewBox="0 0 240 324" className="h-full w-full" role="img" aria-label="watch preview">
      <defs>
        <linearGradient id="wg-strap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={shade(strapC, -18)} />
          <stop offset="0.5" stopColor={shade(strapC, 12)} />
          <stop offset="1" stopColor={shade(strapC, -22)} />
        </linearGradient>
        <linearGradient id="wg-case" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={shade(caseC, 32)} />
          <stop offset="0.5" stopColor={caseC} />
          <stop offset="1" stopColor={shade(caseC, -34)} />
        </linearGradient>
        <linearGradient id="wg-bezel" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={shade(bezelC, 26)} />
          <stop offset="0.55" stopColor={bezelC} />
          <stop offset="1" stopColor={shade(bezelC, -30)} />
        </linearGradient>
        <radialGradient id="wg-dial" cx="0.4" cy="0.36" r="0.78">
          <stop offset="0" stopColor={shade(dialC, 24)} />
          <stop offset="0.55" stopColor={dialC} />
          <stop offset="1" stopColor={shade(dialC, -26)} />
        </radialGradient>
        <filter id="wg-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#000" floodOpacity="0.28" />
        </filter>
        <filter id="wg-lume" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor="#dbe7b0" floodOpacity="0.9" />
        </filter>
      </defs>

      {/* straps + keeper + stitching */}
      <rect x="96" y="2" width="48" height="98" rx="14" fill="url(#wg-strap)" {...sel("strap")} />
      <rect x="96" y="224" width="48" height="98" rx="14" fill="url(#wg-strap)" {...sel("strap")} />
      <rect x="92" y="58" width="56" height="13" rx="5" fill={shade(strapC, -12)} {...sel("keeper")} />
      <g stroke={fill("stitching")} strokeWidth="1.5" strokeDasharray="4 3" fill="none"
         onClick={interactive ? () => onSelect("stitching") : undefined} style={interactive ? { cursor: "pointer" } : undefined}>
        <line x1="101" y1="8" x2="101" y2="96" /><line x1="139" y1="8" x2="139" y2="96" />
        <line x1="101" y1="228" x2="101" y2="316" /><line x1="139" y1="228" x2="139" y2="316" />
      </g>

      {/* floating watch head */}
      <g filter="url(#wg-shadow)">
        {/* crown tucked behind the case */}
        <rect x="188" y="153" width="16" height="18" rx="3" fill="url(#wg-case)" {...sel("crown")} />
        <circle cx={cx} cy={cy} r="72" fill="url(#wg-case)" {...sel("case")} />
        <circle cx={cx} cy={cy} r="62" fill="url(#wg-bezel)" {...sel("bezel")} />
        {/* polished inner-bezel highlight ring */}
        <circle cx={cx} cy={cy} r="56" fill="none" stroke={shade(bezelC, 40)} strokeWidth="0.8" opacity="0.6" />
        <circle cx={cx} cy={cy} r="52" fill="url(#wg-dial)" {...sel("dial")} />

        {/* indices — applied, with a soft lume glow */}
        <g filter="url(#wg-lume)"
           onClick={interactive ? () => onSelect("indices") : undefined} style={interactive ? { cursor: "pointer" } : undefined}>
          {indices.map((p, i) => (
            p.big
              ? <rect key={i} x={p.x - 1.7} y={p.y - 4} width="3.4" height="8" rx="1.4" fill={fill("indices")}
                  transform={`rotate(${(i / 12) * 360} ${p.x} ${p.y})`} stroke={selected === "indices" ? "#191714" : "rgba(0,0,0,0.15)"} strokeWidth="0.5" />
              : <circle key={i} cx={p.x} cy={p.y} r="2.1" fill={fill("indices")} stroke={selected === "indices" ? "#191714" : "none"} strokeWidth="1" />
          ))}
        </g>

        {hasSubdial && (
          <>
            <circle cx={cx} cy={cy + 22} r="12" fill={shade(fill("subdial"), 6)} {...sel("subdial")} />
            <circle cx={cx} cy={cy + 22} r="12" fill="none" stroke={shade(fill("subdial"), -25)} strokeWidth="0.8" />
          </>
        )}

        {/* hands */}
        <g strokeLinecap="round" filter="url(#wg-lume)"
           onClick={interactive ? () => onSelect("hands") : undefined} style={interactive ? { cursor: "pointer" } : undefined}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - 38} stroke={fill("hands")} strokeWidth={selected === "hands" ? 6 : 4.5} />
          <line x1={cx} y1={cy} x2={cx + 26} y2={cy + 4} stroke={fill("hands")} strokeWidth={selected === "hands" ? 5 : 3.5} />
        </g>
        {hasSecondHand && (
          <line x1={cx} y1={cy + 16} x2={cx} y2={cy - 47} stroke={fill("secondHand")} strokeWidth="1.7"
            onClick={interactive ? () => onSelect("secondHand") : undefined} style={interactive ? { cursor: "pointer" } : undefined} />
        )}
        <circle cx={cx} cy={cy} r="3.6" fill={shade(fill("hands"), -10)} />
        <circle cx={cx} cy={cy} r="1.4" fill={shade(fill("hands"), 30)} />
      </g>
    </svg>
  );
}
