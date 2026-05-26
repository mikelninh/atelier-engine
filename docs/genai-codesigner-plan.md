# The Ideal GenAI Co-Designer — synthesis & plan

Synthesized from four simulated sneaker-designer interviews: an indie customizer, a senior performance designer, a streetwear/hype creator, and a sustainability/material designer. Each was asked what they'd want from an ideal GenAI co-designer.

## The one principle they ALL stated

> **"AI is the intern, not the artist."** It proposes; the human locks the decision. Taste, story, structure (biomechanics), and material/ethical truth stay human. The moment it designs *for* you instead of *with* you, it's dead.

Bake this into every interaction: AI always offers options, the human always confirms; nothing irreversible happens automatically.

## What all four independently demanded

1. **Per-part control, never whole-shoe.** "Make it blue" must not recolor the laces and the box. Indie: per-panel masking + regenerate one panel while the rest holds. Performance: edit a seam/panel on a locked last. → **This is exactly our zone system.** Strong validation.
2. **A buildable spec as the output, not just a pretty render.** Performance: PLM-ready tech pack, BOM, Pantone TPX/TCX, graded patterns. Indie: paint-by-panel plan + Angelus shopping list + masking order. Sustainability: BOM + product passport. → **This is exactly our tech-pack prompt structure.** Strong validation.
3. **Believable, manufacturable geometry + correct silhouettes.** Universal hatred of hallucinated shoes: four eyelets, melted swoosh, floating cages, melted laces, plastic surfaces, midsoles tapering to zero.
4. **Real, named materials — no hallucination.** Materials must map to actual, spec-backed options (Angelus codes / Pantone / verified library), never "vibrant orange" or "biodegradable ocean-leather mesh."
5. **Constraint-locked generation.** Lock the last/silhouette/material library; regenerate only within the constraints.
6. **Speed on the divergent front end** + **reference injection** ("feed it a Basquiat / a jacket / my brand palette") + **on-brand consistency across a whole drop**.
7. **End-to-end, one tool** — idea → design → (drop & sell, or factory spec). Don't export across five apps.

## Where each segment diverges (the modules)

- **Indie customizer:** panel-aware masking, Angelus paint-code translation, hand-paint texture realism, non-square aspect (don't crop the heel), granular undo.
- **Performance:** train on *their* last/tooling library privately, gram-count estimator live per material swap, manufacturability checker (injection-mold / Strobel language), PLM export.
- **Streetwear:** "Drop Engine" (teaser → waitlist → numbered/raffle release), social-ready 360 + on-foot renders, a story field that carries through every render/caption.
- **Sustainability:** constraint-locked verified material library (cannot output a non-sourceable material), live nesting/offcut minimizer, auto digital product passport (materials, repair, disassembly, take-back), impact as *ranges with sources*, never one hero number.

## Plan for Atelier Engine (prioritized)

**P0 — strengthen what's validated (we already have the bones):**
- Per-zone control everywhere (2D studio ✅, 3D configurator wired ✅). Add **"lock & regenerate only this zone."**
- **Spec/tech-pack as a first-class export** (we emit the spec block ✅) — extend toward BOM + named colorway list.
- **Real named material library** with attributes (we have named materials ✅) — add per-material data; keep the system prompt's no-hallucination / no-brand rules.

**P1 — high-leverage, broadly wanted:**
- **Reference-image injection** + **"Brand DNA / consistency lock"** so a whole drop reads as one collection.
- Social-ready outputs: the 3D spin (✅) → 360 + on-foot render exports.
- The **Hype Check** panel (✅ built) as the "would the room cop it" gut-check.

**P2 — segment modules (pick by target user):**
- Streetwear → **Drop Engine** (waitlist/numbered/scarcity).
- Performance → **tech-pack/PLM export + manufacturability flags + gram estimate**.
- Sustainability → **verified material library + product passport + impact ranges**.
- Indie → **paint-plan output (Angelus codes + masking order)**.

## The takeaway

Our two core bets — **per-zone control** and **spec-sheet output** — are precisely what designers asked for unprompted. The roadmap isn't a pivot; it's deepening those two, adding reference/brand-consistency, and layering one segment module for whichever user we target first.
