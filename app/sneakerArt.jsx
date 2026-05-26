// Shared sneaker art + colour data used by the zone studio and the drop page,
// so a drop link can reconstruct the exact hero from an encoded colourway.

export const NAMED_COLORS = [
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
export const HEX = Object.fromEntries(NAMED_COLORS.map((c) => [c.label, c.hex]));

// Real material library with spec-backed attributes (honest, sourceable).
export const MATERIALS = [
  { name: "Cloud Suede", finish: "matte nap", composition: "premium bovine suede", eco: "durable, repairable" },
  { name: "Pearl Knit", finish: "matte weave", composition: "recycled poly engineered knit", eco: "~60% recycled content" },
  { name: "Bio Leather", finish: "satin grain", composition: "plant-based (cactus/grape) leather alt", eco: "bio-based, lower-impact" },
  { name: "Carbon Mesh", finish: "low-sheen", composition: "engineered mesh + TPU overlays", eco: "performance, mono-material upper" },
];
export const MATERIAL_BY_NAME = Object.fromEntries(MATERIALS.map((m) => [m.name, m]));

// Stylised low-top profile. Pass `onSelect` to make zones clickable (studio);
// omit it for a display-only hero (drop page).
export function SneakerSVG({ colors, selected = null, onSelect }) {
  const fill = (z) => HEX[colors[z]] || "#ddd";
  const interactive = typeof onSelect === "function";
  const zoneProps = (z) => ({
    fill: fill(z),
    onClick: interactive ? () => onSelect(z) : undefined,
    className: interactive ? "cursor-pointer transition-[stroke] duration-150" : "",
    stroke: selected === z ? "#191714" : "rgba(0,0,0,0.12)",
    strokeWidth: selected === z ? 2.4 : 0.8,
  });
  return (
    <svg viewBox="0 0 440 230" className="w-full" role="img" aria-label="Sneaker design">
      <ellipse cx="225" cy="214" rx="200" ry="9" fill="rgba(0,0,0,0.06)" />
      <path {...zoneProps("outsole")} d="M28,188 C16,190 16,204 32,206 L404,206 C418,206 420,190 408,187 C300,180 120,180 28,188 Z" />
      <path {...zoneProps("midsole")} d="M32,187 C120,180 300,180 408,187 L404,166 C300,159 120,159 34,166 Z" />
      <path {...zoneProps("base")} d="M34,166 C36,150 40,118 78,104 C120,90 168,86 222,88 L312,92 C356,98 388,124 400,160 L408,166 C300,159 120,159 34,166 Z" />
      <path {...zoneProps("toe")} d="M34,166 C36,142 44,118 76,106 C92,120 100,144 102,166 Z" />
      <path {...zoneProps("overlay")} d="M126,164 C126,132 148,112 186,110 C214,108 230,122 230,164 Z" />
      <path {...zoneProps("eyestay")} d="M236,112 L318,94 C342,108 346,132 340,162 L262,162 C246,150 240,130 236,112 Z" />
      <path {...zoneProps("tongue")} d="M214,108 L246,102 L252,80 L222,80 Z" />
      <path {...zoneProps("collar")} d="M312,94 C346,84 380,94 394,120 C380,116 358,112 338,118 C326,104 318,98 312,94 Z" />
      <path {...zoneProps("heelTab")} d="M394,120 C410,128 416,146 412,164 L388,164 C386,144 388,132 394,120 Z" />
      <g onClick={interactive ? () => onSelect("laces") : undefined} className={interactive ? "cursor-pointer" : ""}>
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

// Deterministic drop edition number + certificate id from the encoded design,
// so the same design always gets the same "Edition NNN / 500" + cert hash.
export function dropIdentity(encoded, editionSize = 500) {
  let h = 2166136261;
  for (let i = 0; i < encoded.length; i++) {
    h ^= encoded.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = h >>> 0;
  return {
    edition: (u % editionSize) + 1,
    editionSize,
    cert: u.toString(16).padStart(8, "0").toUpperCase(),
  };
}
