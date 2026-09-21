# RIFTSOLE

**The collectible sneaker generator.**

Choose a world. Generate a sneaker. Evolve its DNA. Reveal its rarity. Keep the ones that matter.

RIFTSOLE is a playable product experiment built around one idea: a sneaker can be a single reproducible object across design, collectibles and games.

## The live loop

1. **Choose a realm** — Skyrealm, Emberland or Mossreach.
2. **Generate** a sneaker from bounded design DNA.
3. **Shape it** — upper, sole, heel, toe, lacing, material, palette and design pressure.
4. **Evolve it** — choose descendants or mutate toward sleeker, wearable, stranger, technical, luxury or wild.
5. **Reveal it** — deterministic name, rarity, flavour text and game stats.
6. **Collect it** — save exact sneaker genomes in the local Vault.
7. **Share it** — shared URLs reconstruct the exact same sneaker.
8. **Play with it** — the same DNA renders a transparent pixel sneaker sprite.

## Three twins, one genome

- **Visual twin** — the live sneaker in the generator.
- **Collectible twin** — the RIFTSOLE rarity card.
- **Game twin** — the procedural pixel sprite.

The state is structured rather than prompt-only, so a sneaker can be reconstructed rather than merely approximated.

## Current product features

- three world-specific design grammars and palettes
- instant deterministic generation
- live DNA controls
- four descendant variants per generation
- directional mutations
- rarity system: Common → Rare → Epic → Legendary → Mythic
- generated names and flavour text
- Speed / Style / Grip stats
- concept pricing
- persistent browser Vault
- shareable sneaker-genome URLs
- transparent pixel sprite export
- responsive RIFTSOLE UI
- Jev-compatible bounded decision context for a future server-side decision layer

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Project structure

```
src/
├── App.jsx               # generator, vault and share flow
├── CollectibleCard.jsx   # collectible card twin
├── SneakerVisual.jsx     # vector sneaker + pixel renderer/export
├── sneakerEngine.js      # worlds, genomes, mutations, rarity, stats
├── index.css             # full RIFTSOLE visual system
└── main.jsx
```

## What this is not yet

The current shoe is a visual/game design twin, **not manufacturing-ready CAD**. The production score is still a heuristic. A real production twin should later be constrained by validated lasts, sole units, material libraries, BOMs and supplier capabilities.

## Next serious layers

- richer modular 3D / WebGL geometry
- multi-angle pixel sprite sheets
- account-backed persistent collections
- public share pages with generated card images
- community remix / lineage graph
- challenges and limited realm drops
- game inventory API
- supplier-backed production modules
- server-side Jev decision layer
- physical sample workflow

---

**RIFTSOLE — real steps, more worlds.**
