# Atelier Engine

**The creator commerce platform for sneaker brands.**

Design it live. Launch it as a sneaker brand. From first sketch to global sales —
creators build micro-brands; the platform handles made-to-order production,
fulfilment, and growth.

This repo contains the early concept dashboard: a single-page React app that
walks through the live design preview, the demand-and-commission economics,
the marketplace pulse, and the two-path business model.

---

## What's in here

- A working concept of the **creator design studio** — pick a model, palette,
  material, and AI style mode; see live updates of price, style match, demand
  score, projected monthly orders, and creator commission.
- A **marketplace pulse** showing the four most popular creator designs
  ranked by orders, with one-click switching into the live preview.
- A **business-model toggle** between *Build our own brand* (full control,
  higher margin) and *Creator micro-brands* (scale across many creators).
- **Inline tests** on the pricing, commission, demand, and lookup logic — runs
  on import; pass/fail surfaced in the dashboard's Tests tile.
- Hara-inspired **calm aesthetic** — warm paper background, single sage accent,
  no decorative noise.

---

## Two paths, one platform

| Mode | Who runs it | Margin model | Best when |
|---|---|---|---|
| **Own brand** | We do | Gross margin (~38%) | Long-term brand equity, recognisable design language |
| **Creator micro-brands** | Creators | Creator commission (~25%) | Scale, niche discovery, fast demand validation |

The toggle in the dashboard re-prices the commission live, so you can model
both strategies against the same design.

---

## Made-to-order, by design

No inventory. No warehouse goblins. Pairs are ordered first, then produced.
Every creator gets a branded drop page, launch tools, and an earnings
dashboard. The platform learns which silhouettes, colours, prices, and
creators convert — that taste graph is the long-term moat.

---

## Local development

Standard Vite + React + Tailwind:

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # static bundle in dist/
npm run preview      # preview the build at :5174
```

---

## Project structure

```
atelier-engine/
├── src/
│   ├── App.jsx        # single-page concept dashboard (the whole product, today)
│   ├── main.jsx       # React entry
│   └── index.css      # Tailwind directives + base typography
├── public/
│   └── sneakers/      # drop real product photography here when ready
├── index.html         # HTML shell + Google Fonts (Cormorant + Inter Tight)
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

---

## Roadmap (as of v0.1)

- [ ] Replace `placehold.co` placeholders with real product photography in `/public/sneakers/`
- [ ] Wire the marketplace to a real database (Supabase or Postgres)
- [ ] Stripe Connect for creator commission payouts
- [ ] Production partner integration for made-to-order fulfilment
- [ ] Creator-side onboarding flow + verified-creator badge
- [ ] German-language landing page
- [ ] Open ambassador + athlete programs (mirror the [CreaPlus pattern](https://github.com/mikelninh/creaplus))

---

## Design principles

The platform follows the same posture as the rest of the
[mikelninh sister projects](https://github.com/mikelninh) — Kenya Hara,
MUJI, *material honesty*. Refuse decoration, trust what remains. No fake
social proof, no manufactured urgency, no countdown timers.

If a feature does not pass the *"would it sit naturally in a Muji store?"*
test, it does not ship.

---

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS 3 (warm paper palette, sage accent) |
| Fonts | Cormorant Garamond (display) · Inter Tight (body) |
| Hosting | Vercel-ready (zero-config Vite deploy) |
| License | MIT |

---

## License

MIT — do what you want, but the rest of the brand and the production network
are not licensed under MIT (those are the moat). See [LICENSE](LICENSE).

---

*Part of the [mikelninh](https://github.com/mikelninh) maker ecosystem.*
