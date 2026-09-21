# Atelier Engine

**Design at the speed of thought.**

Atelier Engine is an experimental live sneaker design system: evolve one shoe through coherent mutations, teach the atelier your taste by choosing descendants, and turn the exact same sneaker DNA into a game-ready pixel asset.

## The loop

**Parent sneaker → 4 descendants → choose what survives → repeat**

The current vertical slice supports:

- live parametric sneaker silhouettes rendered as SVG
- bounded design DNA for sole, upper, toe, heel, lacing, material and colour
- instant directional mutations: sleeker, wearable, stranger, technical, luxurious or surprise
- natural-language direction interpretation in the browser
- lightweight session taste memory from repeated choices
- novelty, wearability and production-proxy signals
- a synced **64×32 transparent pixel sneaker**
- one-click export as **64×32** or nearest-neighbour **256×128 PNG**
- a typed decision context ready to hand to a server-side Jev adapter

## One sneaker, three twins

### 1. Visual twin — now

The browser renders the sneaker from structured design DNA. It is intentionally immediate and bounded: every state maps to a supported visual operation.

### 2. Game twin — now

The same state is rasterised into a tiny transparent pixel sprite. That means the thing designed in the atelier can immediately become:

- equipment
- inventory art
- collectible metadata
- shop merchandise
- world props
- loot or rewards inside our own games

The pixel asset is procedural and deterministic rather than an unrelated AI redraw.

### 3. Production twin — later

The current production score is only a heuristic. A future manufacturing layer should translate supported designs into validated CAD / tech-pack / BOM states and let real manufacturing constraints participate in the decision loop.

## Where Jev fits

Jev is not the mesh or image generator. It is the fast bounded **decision layer**.

The repo exposes `buildJevDecisionContext()` in `src/sneakerEngine.js`. The intended server-side flow is:

1. send current sneaker DNA + direction + learned taste
2. constrain decisions to `OPTION_SETS`
3. let Jev choose a coherent supported mutation
4. validate the returned state
5. render it instantly with the existing visual + pixel engines

The browser currently uses a deterministic local mutation engine so the public GitHub Pages demo remains instant and does not expose API secrets.

## Files

```
src/
├── App.jsx               # live evolution experience
├── SneakerVisual.jsx     # vector sneaker + pixel renderer/export
├── sneakerEngine.js      # design vocabulary, mutations, scores, Jev seam
├── index.css             # atelier + sneaker rendering styles
└── main.jsx
```

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Current product boundary

This is a **playable design vertical slice**, not a claim that every visual state can already be manufactured. The point of this version is to test whether rapid evolution feels magical and whether a user's repeated selections produce a useful taste signal.

Next serious layers:

- server-side Jev adapter
- richer parametric geometry / WebGL or 3D modular parts
- multi-angle pixel sprite sheets
- persistent personal taste graph
- save/share sneaker genome URLs
- production constraints and supplier-backed modules
- game inventory API / export manifest
- physical made-to-order workflow

---

*Atelier Engine — visual twin → game twin → future production twin.*
