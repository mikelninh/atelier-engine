import React, { useEffect, useMemo, useState } from "react";
import CollectibleCard from "./CollectibleCard.jsx";
import {
  PixelSneaker,
  SneakerVisual,
  createShareCardFile,
  exportPixelSneaker,
  exportShareCard,
} from "./SneakerVisual.jsx";
import {
  DIRECTIONS,
  OPTION_SETS,
  PALETTES,
  WORLDS,
  buildTasteProfile,
  createInitialSneaker,
  createWorldSneaker,
  estimatePrice,
  generateDescendants,
  getFlavorText,
  getGameStats,
  getRarity,
  getSneakerName,
  hash,
  mutateSneaker,
  randomizeSneaker,
  setSneakerWorld,
  sneakerFingerprint,
} from "./sneakerEngine.js";

const COLLECTION_KEY = "riftsole.collection.v1";
const FIRST_RUN_KEY = "riftsole.first-run.v1";

const INSTINCTS = [
  { id: "sleeker", icon: "↗", title: "FAST", copy: "Light, sharp, inevitable." },
  { id: "luxury", icon: "✦", title: "ICONIC", copy: "Quiet enough to become a signature." },
  { id: "technical", icon: "⌁", title: "FUTURE", copy: "Engineered like it arrived early." },
  { id: "stranger", icon: "◇", title: "ALIEN", copy: "Make people ask what they are looking at." },
];

function getUrlState() {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      hasDna: Boolean(params.get("dna")),
      view: params.get("view"),
    };
  } catch {
    return { hasDna: false, view: null };
  }
}

function decodeSharedSneaker() {
  try {
    const dna = new URLSearchParams(window.location.search).get("dna");
    if (!dna) return null;
    const base64 = dna.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded));
    if (!parsed || !WORLDS[parsed.world] || !PALETTES[parsed.palette]) return null;
    return parsed;
  } catch {
    return null;
  }
}

function encodeSneaker(sneaker) {
  return btoa(JSON.stringify(sneaker)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildShareUrl(sneaker) {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("dna", encodeSneaker(sneaker));
  url.searchParams.set("view", "card");
  return url;
}

function loadCollection() {
  try {
    const value = JSON.parse(localStorage.getItem(COLLECTION_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function hasSeenFirstRun() {
  try {
    return localStorage.getItem(FIRST_RUN_KEY) === "1";
  } catch {
    return true;
  }
}

function markFirstRunSeen() {
  try {
    localStorage.setItem(FIRST_RUN_KEY, "1");
  } catch {
    // The experience still works when storage is unavailable.
  }
}

function ControlButton({ active, children, onClick, title }) {
  return (
    <button title={title} onClick={onClick} className={"rift-choice " + (active ? "active" : "")}>
      {children}
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rift-mini-stat">
      <div><span>{label}</span><b>{value}</b></div>
      <div className="rift-mini-stat-track"><i style={{ width: value + "%" }} /></div>
    </div>
  );
}

function Candidate({ sneaker, onChoose }) {
  const rarity = getRarity(sneaker);
  const name = getSneakerName(sneaker);
  return (
    <button className="rift-variant" onClick={() => onChoose(sneaker)}>
      <div className="rift-variant-visual">
        <SneakerVisual sneaker={sneaker} className="h-full w-full" />
      </div>
      <div className="rift-variant-meta">
        <span style={{ color: rarity.color }}>{rarity.gem} {rarity.label}</span>
        <b>{name}</b>
        <small>{sneaker.upper} · {sneaker.sole}</small>
      </div>
    </button>
  );
}

function CollectionItem({ item, onLoad, onRemove }) {
  const rarity = getRarity(item);
  return (
    <div className="rift-vault-item">
      <button onClick={() => onLoad(item)} className="rift-vault-preview">
        <PixelSneaker sneaker={item} className="h-20 w-40" />
      </button>
      <div className="rift-vault-meta">
        <span style={{ color: rarity.color }}>{rarity.label}</span>
        <b>{getSneakerName(item)}</b>
        <small>{WORLDS[item.world]?.name} · DNA #{String(item.seed).slice(-6)}</small>
      </div>
      <button className="rift-icon-button" onClick={() => onRemove(item)} aria-label="Remove from collection">×</button>
    </div>
  );
}

function FirstRunExperience({ step, worldId, instinct, onWorld, onInstinct, onNext, onForge, onSkip }) {
  const selectedWorld = WORLDS[worldId] || WORLDS.sky;
  const selectedInstinct = INSTINCTS.find((item) => item.id === instinct) || INSTINCTS[2];

  return (
    <div className="rift-first-run">
      <div className="rift-first-run-noise" />
      <button className="rift-first-skip" onClick={onSkip}>Skip to generator</button>

      <div className="rift-first-brand">
        <span className="rift-first-mark">⌃</span>
        <b>RIFTSOLE</b>
        <small>YOUR FIRST STEP STARTS HERE</small>
      </div>

      <div className="rift-first-progress">
        {[0, 1, 2].map((item) => <i key={item} className={step >= item ? "active" : ""} />)}
      </div>

      {step === 0 && (
        <section className="rift-first-panel rift-first-world-step">
          <span className="rift-first-kicker">01 / CHOOSE A WORLD</span>
          <h1>Where would<br />you run?</h1>
          <p>Don't overthink it. Pick the world that pulls first.</p>

          <div className="rift-first-worlds">
            {Object.values(WORLDS).map((world) => (
              <button
                key={world.id}
                onClick={() => onWorld(world.id)}
                className={"rift-first-world " + (worldId === world.id ? "active" : "")}
                style={{ "--item": world.css.glow, "--item2": world.css.glow2 }}
              >
                <span className="rift-first-world-orb">{world.icon}</span>
                <b>{world.name}</b>
                <small>{world.tagline}</small>
                <em>{world.description}</em>
              </button>
            ))}
          </div>

          <button className="rift-first-next" onClick={onNext}>THIS WORLD →</button>
        </section>
      )}

      {step === 1 && (
        <section className="rift-first-panel">
          <span className="rift-first-kicker">02 / TRUST YOUR INSTINCT</span>
          <h1>What should<br />it feel like?</h1>
          <p>Your answer becomes the first mutation pressure on the design.</p>

          <div className="rift-instincts">
            {INSTINCTS.map((item) => (
              <button
                key={item.id}
                onClick={() => onInstinct(item.id)}
                className={"rift-instinct " + (instinct === item.id ? "active" : "")}
              >
                <span>{item.icon}</span>
                <b>{item.title}</b>
                <small>{item.copy}</small>
              </button>
            ))}
          </div>

          <button className="rift-first-next" onClick={onNext}>LOCK IT IN →</button>
        </section>
      )}

      {step === 2 && (
        <section className="rift-first-panel rift-forge-step">
          <span className="rift-first-kicker">03 / THE FORGE</span>
          <h1>One world.<br />One instinct.</h1>
          <p>Now the generator turns those choices into a sneaker genome that belongs to nobody else.</p>

          <div
            className="rift-forge-orb"
            style={{ "--item": selectedWorld.css.glow, "--item2": selectedWorld.css.glow2 }}
          >
            <div className="rift-forge-ring ring-one" />
            <div className="rift-forge-ring ring-two" />
            <PixelSneaker sneaker={createWorldSneaker(worldId, 777)} className="rift-forge-silhouette" />
          </div>

          <div className="rift-forge-summary">
            <span><small>WORLD</small><b>{selectedWorld.name}</b></span>
            <i>×</i>
            <span><small>INSTINCT</small><b>{selectedInstinct.title}</b></span>
          </div>

          <button className="rift-first-forge" onClick={onForge}>
            <span>✦</span>
            <b>REVEAL MY RIFTSOLE</b>
            <small>forge the first genome</small>
          </button>
        </section>
      )}
    </div>
  );
}

function RevealModal({ sneaker, onClose, onCollect, onShare, onDownload, onCopyPost, onEvolve }) {
  if (!sneaker) return null;
  const rarity = getRarity(sneaker);
  const name = getSneakerName(sneaker);

  return (
    <div className="rift-reveal-backdrop" role="dialog" aria-modal="true" aria-label="RIFTSOLE reveal">
      <div className="rift-reveal-flash" />
      <button className="rift-reveal-close" onClick={onClose}>×</button>

      <div className="rift-reveal-copy">
        <span>YOUR RIFTSOLE HAS ARRIVED</span>
        <div className="rift-reveal-rarity" style={{ "--reveal": rarity.color }}>
          <i>{rarity.gem}</i>
          <b>{rarity.label}</b>
          <i>{rarity.gem}</i>
        </div>
        <h2>{name}</h2>
        <p>Keep it, share it, or evolve it. The genome is yours to remix.</p>

        <div className="rift-reveal-actions">
          <button className="rift-button gold" onClick={onCollect}>◇ KEEP IT</button>
          <button className="rift-button" onClick={onShare}>↗ SHARE</button>
          <button className="rift-button" onClick={onDownload}>↓ POSTER</button>
          <button className="rift-button ghost" onClick={onCopyPost}>COPY POST</button>
        </div>

        <button className="rift-reveal-evolve" onClick={onEvolve}>Not quite. Evolve this pair →</button>
      </div>

      <div className="rift-reveal-card-wrap">
        <CollectibleCard sneaker={sneaker} />
      </div>
    </div>
  );
}

export default function App() {
  const sharedSneaker = useMemo(() => decodeSharedSneaker(), []);
  const urlState = useMemo(() => getUrlState(), []);
  const [sneaker, setSneaker] = useState(() => sharedSneaker || createInitialSneaker());
  const [generation, setGeneration] = useState(1);
  const [direction, setDirection] = useState("wild");
  const [panel, setPanel] = useState("style");
  const [view, setView] = useState(() => urlState.view === "card" || urlState.hasDna ? "card" : "studio");
  const [history, setHistory] = useState([]);
  const [collection, setCollection] = useState(loadCollection);
  const [notice, setNotice] = useState("");
  const [sharedLanding, setSharedLanding] = useState(urlState.hasDna);
  const [firstRunOpen, setFirstRunOpen] = useState(() => !urlState.hasDna && !hasSeenFirstRun());
  const [firstRunStep, setFirstRunStep] = useState(0);
  const [firstWorld, setFirstWorld] = useState("sky");
  const [firstInstinct, setFirstInstinct] = useState("technical");
  const [revealSneaker, setRevealSneaker] = useState(null);

  const world = WORLDS[sneaker.world] || WORLDS.sky;
  const rarity = useMemo(() => getRarity(sneaker), [sneaker]);
  const stats = useMemo(() => getGameStats(sneaker), [sneaker]);
  const name = useMemo(() => getSneakerName(sneaker), [sneaker]);
  const flavor = useMemo(() => getFlavorText(sneaker), [sneaker]);
  const taste = useMemo(() => buildTasteProfile(history), [history]);
  const descendants = useMemo(
    () => generateDescendants(sneaker, direction, generation),
    [sneaker, direction, generation]
  );
  const price = useMemo(() => estimatePrice(sneaker), [sneaker]);

  const shareMeta = useMemo(() => ({
    name,
    rarity,
    stats,
    flavor,
    world: world.name,
  }), [name, rarity, stats, flavor, world.name]);

  useEffect(() => {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection.slice(0, 40)));
  }, [collection]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const detachSharedUrl = () => {
    if (!sharedLanding) return;
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url);
    setSharedLanding(false);
  };

  const remember = (next, options = {}) => {
    if (!options.keepSharedUrl) detachSharedUrl();
    setHistory((items) => [...items, next].slice(-20));
    setSneaker(next);
    setGeneration((value) => value + 1);
  };

  const startReveal = (next) => {
    setSneaker(next);
    setRevealSneaker(next);
    setGeneration((value) => value + 1);
  };

  const patch = (key, value) => {
    remember({
      ...sneaker,
      [key]: value,
      seed: hash(sneaker.seed + ":" + key + ":" + value + ":" + generation),
    });
  };

  const patchNumber = (key, value) => {
    detachSharedUrl();
    setSneaker((current) => ({
      ...current,
      [key]: Number(value),
      seed: hash(current.seed + ":" + key + ":" + value),
    }));
  };

  const chooseWorld = (worldId) => {
    const next = setSneakerWorld(sneaker, worldId);
    remember(next);
  };

  const generate = () => {
    detachSharedUrl();
    const next = randomizeSneaker(sneaker, Date.now());
    setHistory((items) => [...items, next].slice(-20));
    startReveal(next);
  };

  const mutate = (mode) => {
    setDirection(mode);
    remember(mutateSneaker(sneaker, mode, generation % 4, generation + 1));
  };

  const collectSneaker = (target = sneaker) => {
    const id = sneakerFingerprint(target);
    const targetRarity = getRarity(target);
    if (collection.some((item) => sneakerFingerprint(item) === id)) {
      setNotice("Already in your vault");
      return;
    }
    setCollection((items) => [{ ...target, collectedAt: Date.now() }, ...items].slice(0, 40));
    setNotice(targetRarity.label + " collected");
  };

  const removeCollected = (item) => {
    const id = sneakerFingerprint(item);
    setCollection((items) => items.filter((entry) => sneakerFingerprint(entry) !== id));
  };

  const loadCollected = (item) => {
    setSneaker(item);
    setView("studio");
    setGeneration((value) => value + 1);
    setNotice("Loaded " + getSneakerName(item));
  };

  const nativeShare = async (target = sneaker) => {
    const targetName = getSneakerName(target);
    const targetRarity = getRarity(target);
    const targetFlavor = getFlavorText(target);
    const targetStats = getGameStats(target);
    const targetWorld = WORLDS[target.world] || WORLDS.sky;
    const url = buildShareUrl(target);
    const meta = {
      name: targetName,
      rarity: targetRarity,
      stats: targetStats,
      flavor: targetFlavor,
      world: targetWorld.name,
    };

    try {
      const file = await createShareCardFile(target, meta);
      const data = {
        title: "RIFTSOLE — " + targetName,
        text: targetRarity.label + " " + targetName + " · " + targetFlavor,
        url: url.toString(),
        files: [file],
      };

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share(data);
        setNotice("Shared with poster");
        return;
      }

      if (navigator.share) {
        await navigator.share({ title: data.title, text: data.text, url: data.url });
        setNotice("Shared");
        return;
      }

      await navigator.clipboard.writeText(url.toString());
      setNotice("Remix link copied");
    } catch (error) {
      if (error?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url.toString());
          setNotice("Remix link copied");
        } catch {
          setNotice("Share card ready to download");
        }
      }
    }
  };

  const copyPost = async (target = sneaker) => {
    const targetName = getSneakerName(target);
    const targetRarity = getRarity(target);
    const targetStats = getGameStats(target);
    const targetWorld = WORLDS[target.world] || WORLDS.sky;
    const url = buildShareUrl(target);
    const copy = [
      "I found a " + targetRarity.label.toLowerCase() + " " + targetName + " in RIFTSOLE.",
      "",
      targetWorld.name + " · Speed " + targetStats.speed + " · Style " + targetStats.style + " · Grip " + targetStats.grip,
      "",
      "remix this exact pair ↓",
      url.toString(),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(copy);
      setNotice("Post copied");
    } catch {
      setNotice("Copy unavailable");
    }
  };

  const remixShared = () => {
    const next = mutateSneaker(sneaker, "wild", 3, generation + 1);
    detachSharedUrl();
    setDirection("wild");
    setSneaker(next);
    setGeneration((value) => value + 1);
    setView("studio");
    setNotice("Remix started");
  };

  const forgeFirstSneaker = () => {
    let next = createWorldSneaker(firstWorld, hash(Date.now() + ":" + firstWorld));
    next = randomizeSneaker(next, Date.now() + 1);
    next = mutateSneaker(next, firstInstinct, 2, 1);
    markFirstRunSeen();
    setFirstRunOpen(false);
    setHistory([next]);
    setDirection(firstInstinct);
    startReveal(next);
  };

  const skipFirstRun = () => {
    markFirstRunSeen();
    setFirstRunOpen(false);
  };

  const paletteChoices = world.palettes.map((key) => [key, PALETTES[key]]);
  const categoricalPanels = {
    style: [
      ["upper", OPTION_SETS.upper],
      ["sole", OPTION_SETS.sole],
      ["heel", OPTION_SETS.heel],
    ],
    details: [
      ["toe", OPTION_SETS.toe],
      ["lacing", OPTION_SETS.lacing],
    ],
  };

  return (
    <div
      className="rift-app"
      style={{
        "--world": world.css.glow,
        "--world2": world.css.glow2,
        "--panel": world.css.panel,
        "--rarity": rarity.color,
      }}
    >
      <div className="rift-sky rift-sky-one" />
      <div className="rift-sky rift-sky-two" />

      <header className="rift-header">
        <button className="rift-logo" onClick={() => setView("studio")}>
          <span className="rift-mark">⌃</span>
          <span><b>RIFTSOLE</b><small>COLLECT THE STEP</small></span>
        </button>

        <nav className="rift-nav">
          {[
            ["studio", "Generator"],
            ["card", "Card"],
            ["collection", "Vault " + collection.length],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} className={view === id ? "active" : ""}>{label}</button>
          ))}
        </nav>

        <div className="rift-header-actions">
          <button className="rift-button ghost" onClick={() => nativeShare()}>Share</button>
          <button className="rift-button gold" onClick={() => collectSneaker()}>Collect</button>
        </div>
      </header>

      {notice && <div className="rift-toast">{notice}</div>}

      {view === "studio" && (
        <main className="rift-main">
          <section className="rift-hero">
            <div className="rift-eyebrow">THE COLLECTIBLE SNEAKER GENERATOR</div>
            <h1>Design at the speed<br />of thought.</h1>
            <p>Choose a world. Shape the DNA. Evolve it until you find the one worth keeping.</p>

            <div className="rift-worlds">
              {Object.values(WORLDS).map((item) => (
                <button
                  key={item.id}
                  onClick={() => chooseWorld(item.id)}
                  className={"rift-world " + (sneaker.world === item.id ? "active" : "")}
                  style={{ "--item": item.css.glow, "--item2": item.css.glow2 }}
                >
                  <span className="rift-world-icon">{item.icon}</span>
                  <span><b>{item.name}</b><small>{item.tagline}</small></span>
                </button>
              ))}
            </div>
          </section>

          <section className="rift-generator-shell">
            <aside className="rift-left-rail">
              <div className="rift-rail-heading">
                <span>LIVE EVOLUTION</span>
                <b>GEN {String(generation).padStart(2, "0")}</b>
              </div>
              {descendants.slice(0, 3).map((item) => (
                <Candidate key={sneakerFingerprint(item)} sneaker={item} onChoose={remember} />
              ))}
              <button className="rift-rail-refresh" onClick={() => setGeneration((value) => value + 1)}>↻ NEW VARIANTS</button>
            </aside>

            <div className="rift-stage-column">
              <div className="rift-stage">
                <div className="rift-stage-grid" />
                <div className="rift-stage-topline">
                  <span>{world.name.toUpperCase()} / LIVE DNA</span>
                  <span style={{ color: rarity.color }}>{rarity.gem} {rarity.label}</span>
                </div>

                <SneakerVisual sneaker={sneaker} className="rift-main-shoe" />

                <div className="rift-stage-name">
                  <small>RIFTSOLE // #{String(sneaker.seed).slice(-6).padStart(6, "0")}</small>
                  <h2>{name}</h2>
                  <p>{flavor}</p>
                </div>

                <div className="rift-stage-stats">
                  <MiniStat label="SPEED" value={stats.speed} />
                  <MiniStat label="STYLE" value={stats.style} />
                  <MiniStat label="GRIP" value={stats.grip} />
                </div>
              </div>

              <div className="rift-mutate-row">
                {DIRECTIONS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => mutate(item.id)}
                    className={direction === item.id ? "active" : ""}
                    title={item.hint}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="rift-generate-row">
                <button className="rift-generate" onClick={generate}>
                  <span>✦</span>
                  <strong>GENERATE</strong>
                  <small>bring a new step into existence</small>
                </button>
                <button className="rift-button collect-button" onClick={() => collectSneaker()}>◇ COLLECT</button>
                <button className="rift-button share-button" onClick={() => nativeShare()}>↗ SHARE</button>
              </div>
            </div>

            <aside className="rift-control-panel">
              <div className="rift-panel-header">
                <div><span>02</span><b>CREATE YOUR SNEAKER</b></div>
                <small>{taste.confidence}% TASTE SIGNAL</small>
              </div>

              <div className="rift-tabs">
                {[
                  ["style", "Style"],
                  ["color", "Colors"],
                  ["material", "Materials"],
                  ["details", "Details"],
                ].map(([id, label]) => (
                  <button key={id} onClick={() => setPanel(id)} className={panel === id ? "active" : ""}>{label}</button>
                ))}
              </div>

              <div className="rift-controls">
                {(categoricalPanels[panel] || []).map(([key, values]) => (
                  <div className="rift-control-group" key={key}>
                    <label>{key}</label>
                    <div className="rift-choice-grid">
                      {values.map((value) => (
                        <ControlButton key={value} active={sneaker[key] === value} onClick={() => patch(key, value)}>
                          {value}
                        </ControlButton>
                      ))}
                    </div>
                  </div>
                ))}

                {panel === "color" && (
                  <div className="rift-control-group">
                    <label>{world.name} palettes</label>
                    <div className="rift-palette-grid">
                      {paletteChoices.map(([key, value]) => (
                        <button key={key} className={"rift-palette " + (sneaker.palette === key ? "active" : "")} onClick={() => patch("palette", key)}>
                          <i style={{ background: value.primary }} />
                          <i style={{ background: value.secondary }} />
                          <i style={{ background: value.accent }} />
                          <span>{value.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {panel === "material" && (
                  <div className="rift-control-group">
                    <label>material</label>
                    <div className="rift-material-list">
                      {OPTION_SETS.material.map((value) => (
                        <ControlButton key={value} active={sneaker.material === value} onClick={() => patch("material", value)}>
                          <span className="rift-material-dot">{value === "mesh" ? "▦" : value === "knit" ? "≋" : value === "suede" ? "◍" : "◌"}</span>
                          {value}
                        </ControlButton>
                      ))}
                    </div>
                  </div>
                )}

                {panel === "details" && (
                  <div className="rift-slider-stack">
                    {[
                      ["soleBoldness", "Sole boldness"],
                      ["upperComplexity", "Upper complexity"],
                      ["asymmetry", "Asymmetry"],
                    ].map(([key, label]) => (
                      <label key={key} className="rift-slider">
                        <span>{label}<b>{sneaker[key]}</b></span>
                        <input type="range" min="0" max="100" value={sneaker[key]} onChange={(event) => patchNumber(key, event.target.value)} />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="rift-panel-summary">
                <div><span>Concept price</span><b>€{price}</b></div>
                <div><span>World</span><b>{world.name}</b></div>
                <div><span>Material</span><b>{sneaker.material}</b></div>
                <p>{taste.signal}</p>
              </div>
            </aside>
          </section>

          <section className="rift-bottom-strip">
            <div><span>⚡</span><b>GENERATE</b><small>endless combinations</small></div>
            <div><span>♦</span><b>COLLECT</b><small>keep the ones that matter</small></div>
            <div><span>⌘</span><b>SHARE</b><small>same DNA, same sneaker</small></div>
            <div><span>◎</span><b>REMIX</b><small>every share can become a new branch</small></div>
          </section>
        </main>
      )}

      {view === "card" && (
        <main className={"rift-card-page " + (sharedLanding ? "rift-card-shared" : "")}>
          <div className="rift-card-page-copy">
            <span className="rift-eyebrow">{sharedLanding ? "SOMEONE FOUND THIS PAIR" : "YOUR COLLECTIBLE REVEAL"}</span>
            <h1>{name}</h1>
            <p>
              {sharedLanding
                ? "This exact sneaker genome was shared with you. Keep the lineage going by remixing it into something new."
                : "The card is generated from the same sneaker genome. Change the shoe, and its collectible identity changes with it."}
            </p>
            <div className="rift-share-proof">
              <span style={{ color: rarity.color }}>{rarity.gem} {rarity.label}</span>
              <span>{world.name}</span>
              <span>DNA #{String(sneaker.seed).slice(-6).padStart(6, "0")}</span>
            </div>
            <div className="rift-card-page-actions">
              {sharedLanding ? (
                <button className="rift-button gold" onClick={remixShared}>REMIX THIS SNEAKER →</button>
              ) : (
                <button className="rift-button gold" onClick={() => collectSneaker()}>Collect this card</button>
              )}
              <button className="rift-button ghost" onClick={() => nativeShare()}>Share genome</button>
              <button className="rift-button ghost" onClick={() => exportShareCard(sneaker, shareMeta)}>Download poster</button>
              <button className="rift-button ghost" onClick={() => copyPost()}>Copy post</button>
              <button className="rift-button ghost" onClick={() => exportPixelSneaker(sneaker, 4)}>Export sprite</button>
            </div>
          </div>
          <CollectibleCard sneaker={sneaker} />
        </main>
      )}

      {view === "collection" && (
        <main className="rift-vault-page">
          <div className="rift-vault-title">
            <span className="rift-eyebrow">YOUR RIFTSOLE VAULT</span>
            <h1>{collection.length ? collection.length + " collected steps." : "Your first grail is waiting."}</h1>
            <p>Stored locally on this device for now. Every collectible keeps its exact sneaker genome.</p>
          </div>

          {collection.length ? (
            <div className="rift-vault-grid">
              {collection.map((item) => (
                <CollectionItem key={sneakerFingerprint(item)} item={item} onLoad={loadCollected} onRemove={removeCollected} />
              ))}
            </div>
          ) : (
            <div className="rift-empty-vault">
              <PixelSneaker sneaker={sneaker} className="h-24 w-48 opacity-40" />
              <b>Nothing collected yet.</b>
              <span>Generate something you would actually want to keep.</span>
              <button className="rift-button gold" onClick={() => setView("studio")}>Open generator</button>
            </div>
          )}
        </main>
      )}

      <footer className="rift-footer">
        <span>RIFTSOLE · REAL STEPS. MORE WORLDS.</span>
        <span>generate → reveal → collect → share → remix</span>
      </footer>

      {firstRunOpen && (
        <FirstRunExperience
          step={firstRunStep}
          worldId={firstWorld}
          instinct={firstInstinct}
          onWorld={setFirstWorld}
          onInstinct={setFirstInstinct}
          onNext={() => setFirstRunStep((value) => Math.min(2, value + 1))}
          onForge={forgeFirstSneaker}
          onSkip={skipFirstRun}
        />
      )}

      <RevealModal
        sneaker={revealSneaker}
        onClose={() => setRevealSneaker(null)}
        onCollect={() => collectSneaker(revealSneaker)}
        onShare={() => nativeShare(revealSneaker)}
        onDownload={() => exportShareCard(revealSneaker, {
          name: getSneakerName(revealSneaker),
          rarity: getRarity(revealSneaker),
          stats: getGameStats(revealSneaker),
          flavor: getFlavorText(revealSneaker),
          world: WORLDS[revealSneaker.world]?.name,
        })}
        onCopyPost={() => copyPost(revealSneaker)}
        onEvolve={() => {
          const next = mutateSneaker(revealSneaker, "wild", 3, generation + 1);
          setRevealSneaker(null);
          remember(next);
        }}
      />
    </div>
  );
}
