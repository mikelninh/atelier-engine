# Atelier Genome v1

RIFTSOLE proved a useful primitive hiding underneath the sneaker UI:

> **A design can be a reproducible object with canon, mutable traits and lineage.**

Atelier Genome extracts that primitive so it can power more than sneakers.

## Why this matters

Generative tools make variation nearly free. That creates a new problem: **identity drift**.

Without a durable genome, every new prompt can silently change the thing we were supposedly building:

- a HANA jacket loses its silhouette;
- a helmet changes its emblem;
- a collectible forgets its material language;
- a game wearable becomes visually unrelated to the physical product.

The genome separates:

### Canon-locked traits
Identity-changing decisions that generation must not mutate casually.

### Mutable traits
The design space we intentionally allow ourselves to explore.

### Continuous traits
Pressure sliders such as wearability, drama, structure or ornament.

### Lineage
Every descendant points to the exact parent fingerprint and mutation.

## First non-sneaker proof: HANA GH-01

`examples/hana-graphic-hero-gh01.json` records the current Graphic Hero direction:

Locked:

- áo-dài-inspired dual-panel silhouette;
- black base;
- deep-crimson movement colour;
- lotus-spider emblem;
- no slogan.

Mutable:

- collar;
- hem length;
- closure;
- material;
- surface treatment.

The example includes **wearable**, **editorial** and **technical** mutation directions.

The important thing is not that software chooses the final jacket. It does not.

The engine gives the human creative director a reproducible family tree:

```text
GH-01
├── wearable-v1
├── editorial-v1
└── technical-v1
```

Every branch preserves locked canon unless a human explicitly changes the lock.

## API

```js
createGenome(...)
mutateGenome(...)
genomeFingerprint(...)
lineageRecord(...)
compareGenomes(...)
```

Run the proof:

```bash
node scripts/genome-smoke.mjs
```

## Where this can go

The same contract can support:

- HANA garments;
- Firefly helmets;
- HYPERSPACE sneakers;
- premium digital handbags;
- collectible cards;
- game wearables;
- physical/digital twins.

The renderer remains product-specific. The **identity and lineage layer becomes shared**.
