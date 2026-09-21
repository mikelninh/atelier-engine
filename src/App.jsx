import React, { useMemo, useState } from "react";
import {
  DIRECTIONS,
  PALETTES,
  buildTasteProfile,
  createInitialSneaker,
  estimatePrice,
  generateDescendants,
  scoreSneaker,
} from "./sneakerEngine.js";
import { PixelSneaker, SneakerVisual, exportPixelSneaker } from "./SneakerVisual.jsx";

const directionFromText = (value) => {
  const text = value.toLowerCase();
  if (/lux|premium|minimal|quiet|elegant/.test(text)) return "luxury";
  if (/tech|future|tokyo|cyber|performance/.test(text)) return "technical";
  if (/weird|strange|alien|experimental|wild/.test(text)) return "stranger";
  if (/wear|daily|simple|clean|normal/.test(text)) return "wearable";
  if (/sleek|slim|light|fast|low/.test(text)) return "sleeker";
  return "wild";
};

function Icon({ children }) {
  return <span className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white/70 text-sm">{children}</span>;
}

function Pill({ children, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={"rounded-full border px-3.5 py-2 text-sm transition " + (
        active
          ? "border-[#161513] bg-[#161513] text-white shadow-lg"
          : "border-black/10 bg-white/60 text-[#5f5850] hover:bg-white"
      )}
    >
      {children}
    </button>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[.16em] text-white/45">
        <span>{label}</span><span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white/75" style={{ width: value + "%" }} />
      </div>
    </div>
  );
}

function Candidate({ sneaker, index, onChoose }) {
  const score = scoreSneaker(sneaker);
  const palette = PALETTES[sneaker.palette];

  return (
    <button
      onClick={() => onChoose(sneaker)}
      className="group overflow-hidden rounded-[1.8rem] border border-black/[0.07] bg-white/60 text-left shadow-[0_12px_50px_rgba(60,48,36,.06)] transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_70px_rgba(60,48,36,.12)]"
    >
      <div className="relative h-48 overflow-hidden" style={{ background: "linear-gradient(145deg, " + palette.sole + ", #f8f5ef)" }}>
        <SneakerVisual sneaker={sneaker} className="h-full w-full scale-[1.08] transition duration-500 group-hover:scale-[1.13]" />
        <div className="absolute left-3 top-3 rounded-full bg-white/75 px-2.5 py-1 text-[10px] uppercase tracking-[.18em] backdrop-blur">
          {"0" + (index + 1)}
        </div>
        <div className="absolute bottom-3 right-3 opacity-0 transition group-hover:opacity-100">
          <span className="rounded-full bg-[#171512] px-3 py-2 text-xs text-white">Make parent →</span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-medium capitalize">{sneaker.upper} / {sneaker.sole}</p>
            <p className="text-xs capitalize text-[#877e73]">{sneaker.material} · {palette.name}</p>
          </div>
          <PixelSneaker sneaker={sneaker} className="h-10 w-20" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-black/[0.035] px-2 py-2"><b className="block text-sm">{score.novelty}</b><span className="text-[9px] uppercase tracking-wider text-[#8b8176]">novel</span></div>
          <div className="rounded-xl bg-black/[0.035] px-2 py-2"><b className="block text-sm">{score.wearability}</b><span className="text-[9px] uppercase tracking-wider text-[#8b8176]">wear</span></div>
          <div className="rounded-xl bg-black/[0.035] px-2 py-2"><b className="block text-sm">{score.production}</b><span className="text-[9px] uppercase tracking-wider text-[#8b8176]">make</span></div>
        </div>
      </div>
    </button>
  );
}

function Trait({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-black/[0.06] py-2.5 text-sm last:border-0">
      <span className="text-[#80766b]">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}

export default function App() {
  const [parent, setParent] = useState(createInitialSneaker());
  const [direction, setDirection] = useState("wild");
  const [generation, setGeneration] = useState(1);
  const [history, setHistory] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [view, setView] = useState("atelier");

  const descendants = useMemo(
    () => generateDescendants(parent, direction, generation),
    [parent, direction, generation]
  );
  const score = useMemo(() => scoreSneaker(parent), [parent]);
  const taste = useMemo(() => buildTasteProfile(history), [history]);
  const palette = PALETTES[parent.palette];
  const price = estimatePrice(parent);

  const choose = (sneaker) => {
    setHistory((items) => [...items, sneaker]);
    setParent(sneaker);
    setGeneration((g) => g + 1);
  };

  const updateNumber = (key, value) => {
    setParent((current) => ({ ...current, [key]: Number(value), seed: current.seed + 1 }));
    setGeneration((g) => g + 1);
  };

  const applyPrompt = () => {
    if (!prompt.trim()) return;
    setDirection(directionFromText(prompt));
    setGeneration((g) => g + 1);
  };

  return (
    <div className="min-h-screen bg-[#f3efe8] text-[#171512]">
      <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-4 md:px-6">
        <header className="sticky top-3 z-40 mb-5 flex items-center justify-between rounded-full border border-black/[0.07] bg-[#f8f5ef]/85 px-4 py-2.5 shadow-[0_10px_40px_rgba(53,43,31,.07)] backdrop-blur-xl md:px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#171512] text-xs font-semibold text-white">AE</div>
            <div>
              <div className="font-serif text-xl leading-none tracking-[.09em]">SNEAKER ATELIER</div>
              <div className="mt-0.5 text-[9px] uppercase tracking-[.24em] text-[#8c8175]">design at the speed of thought</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full bg-[#dce8d9] px-3 py-1.5 text-xs text-[#35543a]">● instant engine</span>
            <span className="rounded-full bg-[#e9dfd3] px-3 py-1.5 text-xs text-[#6b5947]">Jev-ready</span>
          </div>
        </header>

        <main className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
          <section className="overflow-hidden rounded-[2.6rem] border border-black/[0.06] bg-[#f8f5ef] shadow-[0_30px_100px_rgba(58,46,33,.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4 md:px-7">
              <div>
                <p className="text-[10px] uppercase tracking-[.22em] text-[#8a8074]">Generation {String(generation).padStart(2, "0")} · parent</p>
                <h1 className="mt-1 font-serif text-3xl md:text-4xl">One shoe. Billions of directions.</h1>
              </div>
              <div className="flex rounded-full bg-black/[0.045] p-1">
                <button onClick={() => setView("atelier")} className={"rounded-full px-4 py-2 text-xs transition " + (view === "atelier" ? "bg-white shadow-sm" : "text-[#7c7369]")}>Atelier</button>
                <button onClick={() => setView("pixel")} className={"rounded-full px-4 py-2 text-xs transition " + (view === "pixel" ? "bg-white shadow-sm" : "text-[#7c7369]")}>Game asset</button>
              </div>
            </div>

            {view === "atelier" ? (
              <div className="relative min-h-[520px] overflow-hidden" style={{ background: "linear-gradient(145deg, " + palette.sole + ", #f5f0e7 55%, " + palette.primary + " 88%)" }}>
                <div className="absolute left-6 top-6 z-10 rounded-full border border-black/[0.06] bg-white/60 px-3 py-2 text-[10px] uppercase tracking-[.2em] backdrop-blur">visual twin · live</div>
                <SneakerVisual sneaker={parent} className="h-[520px] w-full md:h-[620px]" />
                <div className="absolute bottom-5 left-5 right-5 z-10 flex flex-wrap items-end justify-between gap-3">
                  <div className="rounded-[1.5rem] border border-white/60 bg-white/70 p-4 shadow-xl backdrop-blur-xl">
                    <p className="text-[10px] uppercase tracking-[.2em] text-[#83796e]">Current DNA</p>
                    <p className="mt-1 text-lg font-medium capitalize">{parent.upper} upper · {parent.sole} sole · {parent.heel} heel</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-[#171512] px-5 py-4 text-white shadow-xl">
                    <p className="text-[10px] uppercase tracking-[.18em] text-white/55">Concept price</p>
                    <p className="mt-1 text-2xl font-medium">€{price}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[520px] place-items-center bg-[#161513] p-8 text-white md:min-h-[620px]">
                <div className="w-full max-w-3xl text-center">
                  <p className="text-[10px] uppercase tracking-[.28em] text-white/45">same DNA · game twin</p>
                  <div className="mx-auto mt-8 grid min-h-[270px] place-items-center rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#22201d,#11100f)] shadow-2xl">
                    <PixelSneaker sneaker={parent} className="h-40 w-80 md:h-56 md:w-[28rem]" />
                  </div>
                  <h2 className="mt-7 font-serif text-4xl">Your sneaker just became loot.</h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/55">
                    Transparent pixel sprite generated from the exact atelier state. Use it as equipment, inventory art, collectible metadata, a shop item, or a world prop.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button onClick={() => exportPixelSneaker(parent, 1)} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black">Export 64×32 PNG</button>
                    <button onClick={() => exportPixelSneaker(parent, 4)} className="rounded-full border border-white/20 px-5 py-3 text-sm text-white hover:bg-white/10">Export 256×128 PNG</button>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-black/[0.06] p-5 md:p-7">
              <div className="mb-4 flex flex-wrap gap-2">
                {DIRECTIONS.map((item) => (
                  <Pill key={item.id} active={direction === item.id} onClick={() => { setDirection(item.id); setGeneration((g) => g + 1); }}>
                    {item.label}
                  </Pill>
                ))}
              </div>
              <div className="flex gap-2 rounded-[1.4rem] border border-black/[0.08] bg-white/70 p-2">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyPrompt()}
                  placeholder={'Try “Tokyo future, wearable, less bulky”…'}
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#a09991]"
                />
                <button onClick={applyPrompt} className="rounded-[1rem] bg-[#171512] px-4 py-2.5 text-sm text-white">Interpret →</button>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-black/[0.06] bg-white/60 p-5 shadow-[0_20px_70px_rgba(58,46,33,.06)]">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="text-[10px] uppercase tracking-[.2em] text-[#8a8074]">Live controls</p><h2 className="mt-1 text-xl font-medium">Shape pressure</h2></div>
                <Icon>⌁</Icon>
              </div>
              <div className="space-y-5">
                {[
                  ["soleBoldness", "Sole boldness"],
                  ["upperComplexity", "Upper complexity"],
                  ["asymmetry", "Asymmetry"],
                ].map(([key, label]) => (
                  <label key={key} className="block">
                    <div className="mb-2 flex items-center justify-between text-xs"><span className="text-[#746b61]">{label}</span><b>{parent[key]}</b></div>
                    <input type="range" min="0" max="100" value={parent[key]} onChange={(e) => updateNumber(key, e.target.value)} className="atelier-range w-full" />
                  </label>
                ))}
              </div>
              <div className="mt-6 grid gap-1 rounded-2xl bg-black/[0.035] px-4 py-2">
                <Trait label="Upper" value={parent.upper} />
                <Trait label="Sole" value={parent.sole} />
                <Trait label="Heel" value={parent.heel} />
                <Trait label="Lacing" value={parent.lacing} />
                <Trait label="Material" value={parent.material} />
                <Trait label="Colour" value={palette.name} />
              </div>
            </section>

            <section className="rounded-[2rem] border border-black/[0.06] bg-[#1b1a18] p-5 text-white shadow-[0_20px_70px_rgba(30,25,20,.13)]">
              <div className="mb-4 flex items-center justify-between">
                <div><p className="text-[10px] uppercase tracking-[.2em] text-white/40">Taste memory</p><h2 className="mt-1 text-xl font-medium">The atelier is learning you.</h2></div>
                <span className="text-xs text-white/40">{taste.confidence}%</span>
              </div>
              <p className="min-h-[44px] text-sm leading-relaxed text-white/60">{taste.signal}</p>
              <div className="mt-5 space-y-3">
                <Metric label="Novelty" value={score.novelty} />
                <Metric label="Wearability" value={score.wearability} />
                <Metric label="Production proxy" value={score.production} />
              </div>
              <p className="mt-5 text-[10px] leading-relaxed text-white/35">
                Taste memory is session-local for now. Production score is a design heuristic, not manufacturing validation.
              </p>
            </section>

            <section className="rounded-[2rem] border border-black/[0.06] bg-[#e8dfd3] p-5">
              <p className="text-[10px] uppercase tracking-[.2em] text-[#806f5f]">Engine architecture</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#4f7657]" /> bounded design vocabulary</div>
                <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#4f7657]" /> instant local mutations</div>
                <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#8f7359]" /> Jev server adapter seam</div>
                <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#4f7657]" /> vector + pixel outputs</div>
              </div>
            </section>
          </aside>
        </main>

        <section className="mt-5 rounded-[2.6rem] border border-black/[0.06] bg-[#e9e3d9] p-5 md:p-7">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[.22em] text-[#82776b]">Live evolution · {DIRECTIONS.find((d) => d.id === direction)?.hint}</p>
              <h2 className="mt-1 font-serif text-4xl">Choose what survives.</h2>
              <p className="mt-2 max-w-2xl text-sm text-[#70675d]">Four coherent descendants. Pick one and it becomes the parent instantly. Your repeated choices form the taste signal for later Jev decisions.</p>
            </div>
            <button onClick={() => setGeneration((g) => g + 1)} className="self-start rounded-full border border-black/10 bg-white/65 px-4 py-2.5 text-sm hover:bg-white md:self-auto">↻ New descendants</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {descendants.map((sneaker, index) => <Candidate key={sneaker.seed + "-" + index} sneaker={sneaker} index={index} onChoose={choose} />)}
          </div>
        </section>

        <footer className="mt-6 flex flex-col justify-between gap-3 px-2 text-xs text-[#8d8377] md:flex-row">
          <span>ATELIER ENGINE · visual twin → game twin → future production twin</span>
          <span>{history.length} choices remembered this session</span>
        </footer>
      </div>
    </div>
  );
}
