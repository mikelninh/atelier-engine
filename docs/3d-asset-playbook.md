# 3D Asset Playbook — great sneaker (and anything) GLBs

How to produce, judge, learn, and share configurator-ready 3D assets. Written for Atelier Engine, generalizes to any product.

## 1. What makes a GLB "great" (the rubric)

A great asset scores well on all six. The first three are artistry; the last three are craft/tech.

1. **Form** — sculpted, correct proportions, reads instantly as the real object. (The artistry. Reference-driven.)
2. **Topology** — clean quads, good edge flow, smooth not faceted, no wasted polys.
3. **Texture/material** — PBR maps: base color, **roughness**, **normal**, AO. Normal maps fake stitching/grain with zero extra geometry.
4. **Scale & transform** — real-world meters, Y-up, centered origin, sits on ground.
5. **Optimization** — tri budget (~50–150k for web), Draco/meshopt compression, sane texture sizes.
6. **Configurator-ready** — one named material per zone, **neutral albedo** (runtime sets color), so per-zone recolor works.

Procedural code (our generator) can nail 4–6 and approximate 1–2, but cannot produce 3 (real texture) — that's the ceiling of the free procedural path.

## 2. Free paths to an asset (no spend)

| Path | Realism | Zone-split? | Effort |
|---|---|---|---|
| **Procedural Blender (bpy)** | stylized | ✅ by design | code only |
| **Phone photogrammetry** (Scaniverse / KIRI / RealityScan, free GLB) | real | ❌ fused mesh | scan + clean |
| **AI image→3D** (Tripo/Meshy free tier) | medium | ❌ usually fused | upload |

**Photogrammetry is the free route to *realistic*.** Scan a real shoe → fused mesh → split into zones (below) → done.

## 3. Turning a fused mesh into a zone-split GLB

1. Import the scan/AI mesh into Blender.
2. **Retopo** if topology is bad (Quad Remesher / manual / Blender's Remesh).
3. **Split into zones:** select faces per part → assign a material named exactly: `base, toe, overlay, eyestay, tongue, collar, heelTab, midsole, outsole, laces`. Or use AI part-segmentation (HoloPart / SAMPart3D) to auto-split.
4. Set each material's base color **neutral white**, keep only AO/normal maps. (Color comes from the app at runtime.)
5. Export GLB: `export_format='GLB', export_apply=True`.
6. Verify: parse the GLB JSON chunk, confirm all zone material names present.

## 4. The generate → rate → iterate agent loop

The mechanism that lets AI agents improve an asset without a human artist:

```
GENERATOR agent (writes bpy → renders preview PNG → exports GLB)
        │  preview.png
        ▼
CRITIC agents (each Reads the PNG, scores the 6-point rubric, lists top-3 fixes)
        │  aggregated feedback
        ▼
LOOP CONTROLLER (averages scores; if < threshold, sends fixes back to GENERATOR)
        ▲────────────────── iterate until score plateaus or threshold met ──┘
```

- **Critics see the image** via the Read tool (Claude reads PNGs visually) — that's what makes rating real.
- Use **2–3 critics with different lenses** (footwear designer / 3D-topology / general aesthetics) to avoid one-note feedback.
- **Bound it:** ~3–4 rounds; stop when the average score stops rising (procedural plateaus).
- **Honest ceiling:** the loop perfects proportions/smoothness/zone-split — it cannot add real leather texture. Output = "great *stylized*," not photoreal.

## 5. Teach & share (the product flywheel)

- **Academy:** teach creators the rubric (§1) + the scan→split pipeline (§3).
- **CC0 base library:** publish a few great zone-split "master last" base models; creators remix colorways; best contributions feed back. The base files become a shared asset for Atelier and its creators.
- **One master per product** (the footwear "last" concept) — everything derives from it.
