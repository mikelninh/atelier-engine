import React, { useEffect, useMemo, useState } from "react";
import CollectibleCard from "./CollectibleCard.jsx";
import { PixelSneaker, SneakerVisual, exportPixelSneaker } from "./SneakerVisual.jsx";
import {
  DIRECTIONS,
  OPTION_SETS,
  PALETTES,
  WORLDS,
  buildTasteProfile,
  createInitialSneaker,
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

function loadCollection() {
  try {
    const value = JSON.parse(localStorage.getItem(COLLECTION_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
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

export default function App() {
  const [sneaker, setSneaker] = useState(() => decodeSharedSneaker() || createInitialSneaker());
  const [generation, setGeneration] = useState(1);
  const [direction, setDirection] = useState("wild");
  const [panel, setPanel] = useState("style");
  const [view, setView] = useState("studio");
  const [history, setHistory] = useState([]);
  const [collection, setCollection] = useState(loadCollection);
  const [notice, setNotice] = useState("");

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

  useEffect(() => {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection.slice(0, 40)));
  }, [collection]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const remember = (next) => {
    setHistory((items) => [...items, next].slice(-20));
    setSneaker(next);
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
    remember(randomizeSneaker(sneaker, Date.now()));
    setNotice("New RIFTSOLE generated");
  };

  const mutate = (mode) => {
    setDirection(mode);
    remember(mutateSneaker(sneaker, mode, generation % 4, generation + 1));
  };

  const collect = () => {
    const id = sneakerFingerprint(sneaker);
    if (collection.some((item) => sneakerFingerprint(item) === id)) {
      setNotice("Already in your vault");
      return;
    }
    setCollection((items) => [{ ...sneaker, collectedAt: Date.now() }, ...items].slice(0, 40));
    setNotice(rarity.label + " collected");
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

  const share = async () => {
    const code = encodeSneaker(sneaker);
    const url = new URL(window.location.href);
    url.searchParams.set("dna", code);
    window.history.replaceState({}, "", url);
    const data = {
      title: "RIFTSOLE — " + name,
      text: rarity.label + " " + name + " · " + flavor,
      url: url.toString(),
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        setNotice("Shared");
      } else {
        await navigator.clipboard.writeText(url.toString());
        setNotice("Share link copied");
      }
    } catch {
      // Native share cancellation is not an error the user needs to see.
    }
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
          <button className="rift-button ghost" onClick={share}>Share</button>
          <button className="rift-button gold" onClick={collect}>Collect</button>
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
                <button className="rift-button collect-button" onClick={collect}>◇ COLLECT</button>
                <button className="rift-button share-button" onClick={share}>↗ SHARE</button>
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
            <div><span>◎</span><b>PLAY</b><small>pixel twin ready for games</small></div>
          </section>
        </main>
      )}

      {view === "card" && (
        <main className="rift-card-page">
          <div className="rift-card-page-copy">
            <span className="rift-eyebrow">YOUR COLLECTIBLE REVEAL</span>
            <h1>{name}</h1>
            <p>The card is generated from the same sneaker genome. Change the shoe, and its collectible identity changes with it.</p>
            <div className="rift-card-page-actions">
              <button className="rift-button gold" onClick={collect}>Collect this card</button>
              <button className="rift-button ghost" onClick={share}>Share genome</button>
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
        <span>visual twin → collectible twin → game twin</span>
      </footer>
    </div>
  );
}
