"use client";

import React, { useMemo, useState } from "react";
import designLibrary from "@/lib/designLibrary.json";

// Adapter: library entries (basePrice, slug) → the design shape the studio
// uses (price, orders, commissionRate). Templates are starting points, so
// orders/commission default to neutral values until the creator publishes.
function templateToDesign(t) {
  return {
    name: t.name,
    creator: t.creator,
    image: t.image,
    modelName: t.modelName,
    paletteName: t.paletteName,
    materialName: t.materialName,
    price: t.basePrice,
    orders: 0,
    commissionRate: 25,
    tagline: t.tagline,
    badge: t.badge,
    slug: t.slug,
  };
}

const sneakerImages = {
  minimalRunner: "/sneakers/aeris-flow.png",
  retroCourt: "/sneakers/court-heritage.png",
  futureMule: "/sneakers/future-slip.png",
  trailBeast: "/sneakers/trailforge-x.png",
};

const materials = [
  { name: "Pearl Knit", finish: "Adaptive woven textile", price: 24, demandBoost: 4 },
  { name: "Cloud Suede", finish: "Soft premium nap", price: 39, demandBoost: 6 },
  { name: "Bio Leather", finish: "Plant-based upper", price: 49, demandBoost: 9 },
  { name: "Carbon Mesh", finish: "Performance weave", price: 59, demandBoost: 8 },
];

const palettes = [
  { name: "Moonstone", primary: "#E9E4D8", secondary: "#B8B1A2", accent: "#282521", trendBoost: 7 },
  { name: "Forest Gum", primary: "#F4EFE4", secondary: "#173F32", accent: "#B67633", trendBoost: 9 },
  { name: "Sand Future", primary: "#D8BFA0", secondary: "#A58F76", accent: "#171615", trendBoost: 8 },
  { name: "Cobalt Trail", primary: "#0C0D10", secondary: "#263042", accent: "#2F5EA8", trendBoost: 10 },
];

const models = [
  { name: "Aeris Flow", category: "chunky lifestyle runner", baseDemand: 91, iconDNA: "New Balance / Asics / luxury runner energy" },
  { name: "Court Heritage", category: "retro court sneaker", baseDemand: 94, iconDNA: "Samba / Dunk / Gazelle / Jordan low-top energy" },
  { name: "Future Slip", category: "comfort mule sneaker", baseDemand: 82, iconDNA: "foam runner / recovery mule / fashion-tech energy" },
  { name: "Trailforge X", category: "performance trail sneaker", baseDemand: 87, iconDNA: "Salomon / techwear / outdoor crossover energy" },
];

const aiModes = ["Luxury Minimalist", "Street Ritual", "Performance Beast", "Collector Grail"];

const brandModes = [
  {
    id: "own-brand",
    title: "Build our own brand",
    subtitle: "Create and launch a flagship sneaker brand with full control and ownership.",
    commissionLabel: "Gross margin",
    defaultRate: 38,
    note: "Best when we want long-term brand equity, stronger margins, and a recognisable design language.",
  },
  {
    id: "creator-platform",
    title: "Creator micro-brands",
    subtitle: "Creators launch niche sneaker drops while we power production, storefronts, and tools.",
    commissionLabel: "Creator commission",
    defaultRate: 25,
    note: "Best for scale: many creators, many niches, more data, and faster demand discovery.",
  },
];

const popularDesigns = [
  { rank: 1, name: "Aeris Flow", creator: "MotionLab", image: sneakerImages.minimalRunner, modelName: "Aeris Flow", paletteName: "Moonstone", materialName: "Pearl Knit", price: 249, orders: 2451, commissionRate: 25, tagline: "Light. Balanced. Effortless.", badge: "Bestseller" },
  { rank: 2, name: "Court Heritage", creator: "Court Culture", image: sneakerImages.retroCourt, modelName: "Court Heritage", paletteName: "Forest Gum", materialName: "Bio Leather", price: 219, orders: 1892, commissionRate: 22, tagline: "Retro soul. Modern edge.", badge: "Mass Appeal" },
  { rank: 3, name: "Future Slip", creator: "Vision Collective", image: sneakerImages.futureMule, modelName: "Future Slip", paletteName: "Sand Future", materialName: "Cloud Suede", price: 279, orders: 1376, commissionRate: 26, tagline: "Not from now. From next.", badge: "Hype Pick" },
  { rank: 4, name: "Trailforge X", creator: "Wild Origins", image: sneakerImages.trailBeast, modelName: "Trailforge X", paletteName: "Cobalt Trail", materialName: "Carbon Mesh", price: 259, orders: 1105, commissionRate: 24, tagline: "Built wild. Made to endure.", badge: "Performance" },
];

const marketArchetypes = [
  { name: "Retro Court", popularity: 94, examples: "Samba, Dunk, Gazelle, Jordan lows", audience: "streetwear + collectors", commissionBoost: 2 },
  { name: "Chunky Runner", popularity: 91, examples: "Asics, New Balance, dad-shoe runners", audience: "comfort + fashion", commissionBoost: 1 },
  { name: "Foam Future", popularity: 88, examples: "foam runners, recovery shoes, mules", audience: "comfort rebels + hype buyers", commissionBoost: 1 },
  { name: "Trail Tech", popularity: 89, examples: "Salomon, techwear trail shoes", audience: "outdoor + fashion crossover", commissionBoost: 2 },
];

export function calculateSneakerPrice(materialPrice, soleBoldness) {
  const basePrice = 189;
  const safeMaterialPrice = Number.isFinite(materialPrice) ? materialPrice : 0;
  const safeSoleBoldness = Number.isFinite(soleBoldness) ? soleBoldness : 0;
  return basePrice + safeMaterialPrice + Math.round(safeSoleBoldness / 2);
}

export function calculateCommission(orderPrice, commissionRate) {
  const safeOrderPrice = Number.isFinite(orderPrice) ? orderPrice : 0;
  const safeCommissionRate = Number.isFinite(commissionRate) ? commissionRate : 0;
  return Number((safeOrderPrice * (safeCommissionRate / 100)).toFixed(2));
}

export function estimateDemandScore(modelDemand, paletteTrendBoost, materialDemandBoost, styleMatch, price) {
  const safeModelDemand = Number.isFinite(modelDemand) ? modelDemand : 0;
  const safePaletteBoost = Number.isFinite(paletteTrendBoost) ? paletteTrendBoost : 0;
  const safeMaterialBoost = Number.isFinite(materialDemandBoost) ? materialDemandBoost : 0;
  const safeStyleMatch = Number.isFinite(styleMatch) ? styleMatch : 0;
  const safePrice = Number.isFinite(price) ? price : 0;
  const pricePenalty = safePrice > 260 ? Math.round((safePrice - 260) / 10) : 0;
  const score = Math.round(safeModelDemand * 0.44 + safeStyleMatch * 0.34 + safePaletteBoost + safeMaterialBoost - pricePenalty);
  return Math.max(1, Math.min(100, score));
}

export function estimateMonthlyOrders(demandScore, socialHeat, price) {
  const safeDemandScore = Number.isFinite(demandScore) ? demandScore : 0;
  const safeSocialHeat = Number.isFinite(socialHeat) ? socialHeat : 0;
  const safePrice = Number.isFinite(price) ? price : 0;
  const pricePenalty = safePrice > 260 ? Math.round((safePrice - 260) / 6) : 0;
  return Math.max(0, Math.round(safeDemandScore * 11 + safeSocialHeat * 4.5 - pricePenalty));
}

export function estimateMonthlyUpside(monthlyOrders, commissionPerPair) {
  const safeOrders = Number.isFinite(monthlyOrders) ? monthlyOrders : 0;
  const safeCommission = Number.isFinite(commissionPerPair) ? commissionPerPair : 0;
  return Math.round(safeOrders * safeCommission);
}

export function getStyleMatch(aiMode, materialName, modelName) {
  const modeBonus = { "Luxury Minimalist": 4, "Street Ritual": 6, "Performance Beast": 7, "Collector Grail": 9 };
  const materialBonus = materialName === "Carbon Mesh" ? 3 : materialName === "Bio Leather" ? 2 : 1;
  const modelBonus = modelName === "Court Heritage" || modelName === "Aeris Flow" ? 2 : 0;
  return Math.min(99, 85 + (modeBonus[aiMode] || 0) + materialBonus + modelBonus);
}

export function getBestMarketArchetype(modelName) {
  if (modelName === "Court Heritage") return marketArchetypes[0];
  if (modelName === "Aeris Flow") return marketArchetypes[1];
  if (modelName === "Future Slip") return marketArchetypes[2];
  return marketArchetypes[3];
}

export function getEntityByName(list, name, fallbackIndex = 0) {
  return list.find((item) => item.name === name) || list[fallbackIndex];
}

export const sneakerCustomizerTests = [
  { name: "base price includes material and rounded sole surcharge", passed: calculateSneakerPrice(24, 42) === 234 },
  { name: "zero sole boldness keeps only base plus material", passed: calculateSneakerPrice(39, 0) === 228 },
  { name: "invalid price inputs fail safely instead of crashing", passed: calculateSneakerPrice(Number.NaN, Number.NaN) === 189 },
  { name: "maximum sole boldness adds fifty euros", passed: calculateSneakerPrice(59, 100) === 298 },
  { name: "commission keeps cents for realistic economics", passed: calculateCommission(249, 25) === 62.25 },
  { name: "commission handles invalid input safely", passed: calculateCommission(Number.NaN, 25) === 0 },
  { name: "demand score never exceeds one hundred", passed: estimateDemandScore(200, 50, 50, 200, 100) === 100 },
  { name: "monthly orders never go below zero", passed: estimateMonthlyOrders(1, 0, 1200) === 0 },
  { name: "Court Heritage maps to retro court market archetype", passed: getBestMarketArchetype("Court Heritage").name === "Retro Court" },
  { name: "monthly upside multiplies order volume by commission", passed: estimateMonthlyUpside(100, 62.25) === 6225 },
  { name: "popular design lookup resolves palette by name", passed: getEntityByName(palettes, "Cobalt Trail").accent === "#2F5EA8" },
  { name: "missing lookup falls back safely", passed: getEntityByName(materials, "Missing Material").name === "Pearl Knit" },
  { name: "all popular designs have image paths", passed: popularDesigns.every((design) => Boolean(design.image)) },
];

function Card({ children, className = "" }) {
  return <div className={`rounded-[2rem] border border-black/5 shadow-xl ${className}`}>{children}</div>;
}

function Button({ children, className = "", variant = "solid", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-black/20 disabled:cursor-not-allowed disabled:opacity-50";
  const styles = variant === "outline" ? "border border-[#d9d0c4] bg-white/60 text-[#191714] hover:bg-white" : "bg-[#191714] text-white hover:bg-[#302d28] shadow-lg shadow-black/10";
  return <button className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
}

function Icon({ name, className = "w-4 h-4" }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const icons = {
    arrow: <svg {...common}><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>,
    bag: <svg {...common}><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>,
    bell: <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>,
    chart: <svg {...common}><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 15l3-4 3 2 5-7" /></svg>,
    check: <svg {...common}><path d="M20 6L9 17l-5-5" /></svg>,
    chevron: <svg {...common}><path d="M9 18l6-6-6-6" /></svg>,
    cube: <svg {...common}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M4 7.5l8 4.5 8-4.5" /><path d="M12 12v9" /></svg>,
    heart: <svg {...common}><path d="M20.8 8.6c0 5.6-8.8 10.4-8.8 10.4S3.2 14.2 3.2 8.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2z" /></svg>,
    info: <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 10v6" /><path d="M12 7h.01" /></svg>,
    palette: <svg {...common}><path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 1.4-3.4 1.7 1.7 0 0 1 1.2-2.9H18a6 6 0 0 0 0-12h-6z" /></svg>,
    people: <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    rocket: <svg {...common}><path d="M4.5 16.5c-1.2 1.2-1.5 3-1.5 4.5 1.5 0 3.3-.3 4.5-1.5" /><path d="M9 15l-3 3" /><path d="M15 9l-6 6" /><path d="M14 4l6 6-5 5-6-6 5-5z" /></svg>,
    search: <svg {...common}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" /></svg>,
    sliders: <svg {...common}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /><circle cx="8" cy="6" r="2" /><circle cx="14" cy="12" r="2" /><circle cx="10" cy="18" r="2" /></svg>,
    sparkles: <svg {...common}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" /></svg>,
    upload: <svg {...common}><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M5 20h14" /></svg>,
  };
  return icons[name] || icons.check;
}

function formatCurrency(value) {
  return `€${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function MiniLine() {
  return (
    <svg viewBox="0 0 120 34" className="h-9 w-28 text-green-600" fill="none" aria-hidden="true">
      <path d="M4 27C18 27 17 23 31 24C45 25 42 20 55 21C69 22 70 15 83 16C96 17 101 10 116 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M111 6h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Donut({ value, suffix = "%" }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="relative h-20 w-20 rounded-full grid place-items-center" style={{ background: `conic-gradient(#9b8066 ${safeValue * 3.6}deg, #eadfd2 0deg)` }}>
      <div className="h-14 w-14 rounded-full bg-white grid place-items-center text-sm font-semibold">{safeValue}{suffix}</div>
    </div>
  );
}

function ProductImage({ design, className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-[1.5rem] bg-[#f6f1ea] ${className}`}>
      <img src={design.image} alt={`${design.name} sneaker design`} className="h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/[0.03]" />
    </div>
  );
}

function Header() {
  return (
    <header className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-black/5 bg-white/70 p-4 shadow-xl shadow-black/[0.04] backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-8">
        <div className="font-serif text-2xl tracking-[0.18em]">ATELIER ENGINE</div>
        <nav className="hidden items-center gap-2 text-sm lg:flex">
          {["Dashboard", "Design Studio", "Marketplace", "Orders", "Analytics", "Resources"].map((item, index) => (
            <button key={item} className={`rounded-2xl px-4 py-2 transition ${index === 0 ? "bg-[#eadfd2]" : "hover:bg-[#f4ece3]"}`}>{item}</button>
          ))}
        </nav>
      </div>
      <div className="flex items-center justify-between gap-4 md:justify-end">
        <button className="rounded-full p-2 hover:bg-[#f4ece3]" aria-label="Search"><Icon name="search" className="h-5 w-5" /></button>
        <button className="relative rounded-full p-2 hover:bg-[#f4ece3]" aria-label="Notifications">
          <Icon name="bell" className="h-5 w-5" />
          <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-[#9b8066] text-[10px] text-white">3</span>
        </button>
        <div className="flex items-center gap-3 border-l border-black/10 pl-4">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#d9c8b8] font-serif text-lg">A</div>
          <div className="hidden sm:block"><p className="text-sm font-semibold">Alex Mercer</p><p className="text-xs text-[#786f64]">Creator</p></div>
        </div>
      </div>
    </header>
  );
}

function Hero({ onStart }) {
  return (
    <section className="space-y-6 lg:pr-6">
      <div className="inline-flex rounded-xl bg-[#ead8c5] px-3 py-2 text-xs uppercase tracking-wide text-[#7b5d43]">The creator commerce platform for sneaker brands</div>
      <div>
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tight md:text-6xl">Design it live.<br />Launch it as a sneaker brand.</h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-[#6f665d]">From first sketch to global sales. Creators build micro-brands, we handle made-to-order production, fulfilment, and growth.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onStart}>Start Designing <Icon name="arrow" /></Button>
        <Button variant="outline">How it works <span className="grid h-6 w-6 place-items-center rounded-full border border-black/20">▶</span></Button>
      </div>
    </section>
  );
}

function ToolRail() {
  const tools = [["palette", "Materials"], ["sliders", "Colors"], ["cube", "Details"], ["upload", "Branding"]];
  return (
    <div className="absolute left-4 top-16 z-10 hidden rounded-[1.4rem] border border-black/5 bg-white/75 p-2 shadow-xl backdrop-blur md:block">
      {tools.map(([icon, label]) => (
        <button key={label} className="flex w-16 flex-col items-center gap-1 rounded-2xl px-2 py-3 text-xs text-[#6f665d] hover:bg-[#f4ece3]">
          <Icon name={icon} /><span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function LiveDesignPreview({ selectedDesign, price, styleMatch, demandScore, commission, published }) {
  return (
    <Card className="relative overflow-hidden bg-white/65">
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <div><p className="text-xs uppercase tracking-[0.22em] text-[#786f64]">Live Design Preview</p><h2 className="text-xl font-semibold">{selectedDesign.name}</h2></div>
        <div className="flex items-center gap-2 text-sm text-green-700"><span className="h-2 w-2 rounded-full bg-green-600" />{published ? "Marketplace Live" : "Live"}</div>
      </div>
      <div className="relative min-h-[420px] bg-gradient-to-br from-[#f4ece3] via-[#f8f4ee] to-[#e8ded2] p-5 md:min-h-[520px]">
        <ToolRail />
        <ProductImage design={selectedDesign} className="mx-auto h-[330px] max-w-[760px] md:h-[430px]" />
        <div className="absolute bottom-5 right-5 rounded-3xl border border-black/5 bg-white/85 p-5 shadow-xl backdrop-blur">
          <p className="text-xs text-[#786f64]">Estimated made-to-order price</p>
          <div className="mt-1 flex items-end gap-4"><p className="text-4xl font-semibold">€{price}</p><span className="mb-1 rounded-full bg-[#f4ece3] px-3 py-1 text-xs">EUR ⌄</span></div>
        </div>
        <div className="absolute bottom-5 left-5 flex gap-2">
          {["↶", "↻", "↗"].map((item) => <button key={item} className="grid h-11 w-11 place-items-center rounded-full bg-white/80 shadow-md backdrop-blur">{item}</button>)}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 p-4">
        <div className="rounded-2xl bg-[#f7f2e8] p-3"><p className="text-xs text-[#786f64]">Style match</p><p className="text-xl font-semibold">{styleMatch}%</p></div>
        <div className="rounded-2xl bg-[#f7f2e8] p-3"><p className="text-xs text-[#786f64]">Demand</p><p className="text-xl font-semibold">{demandScore}/100</p></div>
        <div className="rounded-2xl bg-[#f7f2e8] p-3"><p className="text-xs text-[#786f64]">Creator earns</p><p className="text-xl font-semibold">{formatCurrency(commission)}</p></div>
      </div>
    </Card>
  );
}

function MetricPanel({ styleMatch, demandScore, commission, monthlyOrders, monthlyUpside, commissionRate, onPublish }) {
  const metrics = [
    { title: "Style Match", subtitle: "How well your design resonates", value: styleMatch, suffix: "%" },
    { title: "Demand Score", subtitle: "Predicted market demand", value: demandScore, suffix: "/100" },
  ];
  return (
    <Card className="bg-white/70 p-5">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Performance Overview</h2><Icon name="sparkles" className="text-[#9b8066]" /></div>
      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.title} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><p className="font-semibold">{metric.title}</p><Icon name="info" className="h-3.5 w-3.5 text-[#9b8066]" /></div>
                <p className="mt-1 text-xs text-[#786f64]">{metric.subtitle}</p>
                <MiniLine />
              </div>
              <Donut value={metric.value} suffix={metric.suffix === "%" ? "%" : ""} />
            </div>
          </div>
        ))}
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2"><p className="font-semibold">Creator Commission</p><Icon name="info" className="h-3.5 w-3.5 text-[#9b8066]" /></div>
              <p className="mt-1 text-xs text-[#786f64]">Per pair after fulfilment</p>
              <p className="mt-3 text-3xl font-semibold">{formatCurrency(commission)}</p>
            </div>
            <div className="rounded-2xl bg-[#eadfd2] px-4 py-2 text-sm font-semibold">{commissionRate}%</div>
          </div>
        </div>
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="font-semibold">Monthly Orders</p><p className="mt-1 text-xs text-[#786f64]">Projected next 30 days</p>
          <div className="mt-3 flex items-end justify-between"><p className="text-3xl font-semibold">{monthlyOrders.toLocaleString()}</p><p className="text-sm text-green-700">↑ 18.6%</p></div>
        </div>
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="font-semibold">Monthly Upside</p><p className="mt-1 text-xs text-[#786f64]">Projected creator profit</p>
          <div className="mt-3 flex items-end justify-between"><p className="text-3xl font-semibold">{formatCurrency(monthlyUpside)}</p><p className="text-sm text-green-700">↑ 21.4%</p></div>
        </div>
      </div>
      <div className="mt-5 space-y-3"><Button onClick={onPublish} className="w-full py-4">Go Live <Icon name="rocket" /></Button><Button variant="outline" className="w-full py-4"><Icon name="cube" /> Simulate Variants</Button></div>
    </Card>
  );
}

function ProductCard({ design, active, onSelect }) {
  const commission = calculateCommission(design.price, design.commissionRate);
  return (
    <button onClick={() => onSelect(design)} className={`group rounded-[1.7rem] border p-3 text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl ${active ? "border-[#191714] bg-white" : "border-black/5 bg-white/75"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-[#191714] px-3 py-1 text-xs text-white">#{design.rank} trending</span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"><Icon name="heart" /></span>
      </div>
      <ProductImage design={design} className="h-44" />
      <div className="mt-3 flex items-start justify-between gap-2">
        <div><h3 className="font-semibold uppercase tracking-wide">{design.name}</h3><p className="text-sm text-[#786f64]">by {design.creator}</p></div>
        {design.badge && <span className="rounded-xl bg-[#eadfd2] px-2 py-1 text-xs text-[#7b5d43]">{design.badge}</span>}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#e8dfd2] pt-3 text-sm">
        <div><p className="text-[#786f64]">{design.orders.toLocaleString()} orders</p><p className="text-xs text-[#786f64]">{design.tagline}</p></div>
        <div className="text-right"><p className="text-lg font-semibold">€{design.price}</p><p className="text-xs text-[#786f64]">Earn {formatCurrency(commission)}</p></div>
      </div>
    </button>
  );
}

function TemplateGallery({ selectedDesign, onSelect }) {
  return (
    <Card className="bg-white/50 p-4">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#786f64]">Start from a template</p>
          <h2 className="text-2xl font-semibold">{designLibrary.length} starter designs · fork &amp; remix</h2>
          <p className="mt-1 text-sm text-[#786f64]">Pick any silhouette to load into the studio. Adjust palette, material, and price — then publish your own drop.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {designLibrary.map((t) => {
          const active = selectedDesign.slug === t.slug || selectedDesign.name === t.name;
          return (
            <button
              key={t.slug}
              onClick={() => onSelect(templateToDesign(t))}
              className={`group flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition hover:shadow-md ${active ? "border-[#191714] ring-2 ring-[#191714]/10" : "border-black/5"}`}
            >
              <div className="relative aspect-square overflow-hidden bg-[#efe7d6]">
                <img src={t.image} alt={t.name} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#191714]">{t.badge}</span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 p-3">
                <p className="text-sm font-semibold leading-tight">{t.name}</p>
                <p className="text-[11px] text-[#786f64]">by {t.creator}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[#786f64]">{t.modelName} · €{t.basePrice}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Marketplace({ selectedDesign, onSelect }) {
  return (
    <Card className="bg-white/50 p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.18em] text-[#786f64]">Marketplace pulse</p><h2 className="text-2xl font-semibold">Most popular creator sneakers</h2></div>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="outline" className="px-3 py-1.5">View all</Button>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">‹</button>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">›</button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {popularDesigns.map((design) => <ProductCard key={design.name} design={design} active={selectedDesign.name === design.name} onSelect={onSelect} />)}
      </div>
    </Card>
  );
}

function BusinessModel({ brandMode, onSwitch }) {
  return (
    <Card className="bg-[#efe4d8] p-5">
      <div className="grid gap-4 md:grid-cols-[0.7fr_1fr_1fr] md:items-center">
        <div><h2 className="font-serif text-3xl leading-tight">Two paths.<br />One platform.</h2><p className="mt-3 text-sm text-[#786f64]">Choose how you want to build and grow your sneaker brand.</p></div>
        {brandModes.map((mode) => (
          <button key={mode.id} onClick={() => onSwitch(mode)} className={`flex items-center justify-between rounded-[1.5rem] border p-5 text-left transition ${brandMode.id === mode.id ? "border-[#191714] bg-white" : "border-black/5 bg-white/50 hover:bg-white"}`}>
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[#eadfd2]"><Icon name={mode.id === "own-brand" ? "bag" : "people"} className="h-6 w-6" /></div>
              <div><p className="font-semibold">{mode.title}</p><p className="mt-1 text-sm text-[#786f64]">{mode.subtitle}</p></div>
            </div>
            <Icon name="chevron" />
          </button>
        ))}
      </div>
    </Card>
  );
}

export default function App() {
  const [selectedDesign, setSelectedDesign] = useState(popularDesigns[0]);
  const [aiMode, setAiMode] = useState("Collector Grail");
  const [brandMode, setBrandMode] = useState(brandModes[1]);
  const [published, setPublished] = useState(false);

  const selectedModel = getEntityByName(models, selectedDesign.modelName);
  const selectedPalette = getEntityByName(palettes, selectedDesign.paletteName);
  const selectedMaterial = getEntityByName(materials, selectedDesign.materialName);
  const archetype = getBestMarketArchetype(selectedModel.name);
  const effectiveCommissionRate = selectedDesign.commissionRate + (brandMode.id === "creator-platform" ? 0 : archetype.commissionBoost);

  const styleMatch = useMemo(() => getStyleMatch(aiMode, selectedMaterial.name, selectedModel.name), [aiMode, selectedMaterial.name, selectedModel.name]);
  const demandScore = useMemo(() => estimateDemandScore(selectedModel.baseDemand, selectedPalette.trendBoost, selectedMaterial.demandBoost, styleMatch, selectedDesign.price), [selectedModel, selectedPalette, selectedMaterial, styleMatch, selectedDesign.price]);
  const commission = useMemo(() => calculateCommission(selectedDesign.price, effectiveCommissionRate), [selectedDesign.price, effectiveCommissionRate]);
  const monthlyOrders = useMemo(() => estimateMonthlyOrders(demandScore, selectedDesign.orders / 100, selectedDesign.price), [demandScore, selectedDesign.orders, selectedDesign.price]);
  const monthlyUpside = useMemo(() => estimateMonthlyUpside(monthlyOrders, commission), [monthlyOrders, commission]);
  const allTestsPassed = sneakerCustomizerTests.every((test) => test.passed);

  function selectDesign(design) {
    setSelectedDesign(design);
    setAiMode(design.name === "Trailforge X" ? "Performance Beast" : "Collector Grail");
    setPublished(false);
  }

  return (
    <div className="min-h-screen bg-[#f5efe7] p-3 text-[#191714] md:p-5">
      <div className="mx-auto max-w-[1800px]">
        <Header />
        <main className="grid gap-5 xl:grid-cols-[0.95fr_1.55fr_0.85fr]">
          <Hero onStart={() => setPublished(true)} />
          <LiveDesignPreview selectedDesign={selectedDesign} price={selectedDesign.price} styleMatch={styleMatch} demandScore={demandScore} commission={commission} published={published} />
          <MetricPanel styleMatch={styleMatch} demandScore={demandScore} commission={commission} monthlyOrders={monthlyOrders} monthlyUpside={monthlyUpside} commissionRate={effectiveCommissionRate} onPublish={() => setPublished(true)} />
        </main>
        <div className="mt-5"><Marketplace selectedDesign={selectedDesign} onSelect={selectDesign} /></div>
        <div className="mt-5"><TemplateGallery selectedDesign={selectedDesign} onSelect={selectDesign} /></div>
        <div className="mt-5"><BusinessModel brandMode={brandMode} onSwitch={setBrandMode} /></div>
        <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            ["Tests", allTestsPassed ? "All product logic checks passed." : "Some product logic checks failed."],
            ["Creator storefronts", "Every creator gets a branded drop page, launch tools, and earnings dashboard."],
            ["No inventory risk", "Pairs are ordered first, then produced. Fewer dead-stock goblins."],
            ["Taste graph", "The platform learns which silhouettes, colours, prices, and creators convert."],
          ].map(([title, text]) => (
            <Card key={title} className="rounded-[1.5rem] bg-white/65 p-5">
              <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{title}</h3><Icon name={title === "Tests" ? "check" : "chevron"} /></div>
              <p className="text-sm text-[#6f665d]">{text}</p>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
