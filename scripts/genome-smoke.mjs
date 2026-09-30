import assert from "node:assert/strict";
import fs from "node:fs";

import {
  compareGenomes,
  createGenome,
  genomeFingerprint,
  lineageRecord,
  mutateGenome
} from "../src/atelierGenome.js";

const seed = JSON.parse(fs.readFileSync(new URL("../examples/hana-graphic-hero-gh01.json", import.meta.url), "utf8"));
const base = createGenome(seed);

assert.equal(base.kind, "garment");
assert.equal(base.traits.emblem, "lotus-spider");
assert.equal(base.traits.slogan_policy, "none");
assert.equal(base.fingerprint, genomeFingerprint(base));

const wearableA = mutateGenome(base, {
  mutationId: "wearable-v1",
  ...seed.candidate_mutations.wearable,
  vocabulary: seed.vocabulary
});
const wearableB = mutateGenome(base, {
  mutationId: "wearable-v1",
  ...seed.candidate_mutations.wearable,
  vocabulary: seed.vocabulary
});

assert.equal(wearableA.fingerprint, wearableB.fingerprint, "same mutation must be reproducible");
assert.equal(wearableA.traits.silhouette, base.traits.silhouette);
assert.equal(wearableA.traits.emblem, base.traits.emblem);
assert.equal(wearableA.traits.slogan_policy, "none");
assert.ok(wearableA.continuous.wearability > base.continuous.wearability);
assert.equal(lineageRecord(wearableA).parent, base.fingerprint);

const diff = compareGenomes(base, wearableA);
assert.equal(diff.sameCanon, true);
assert.deepEqual(diff.traitChanges.hem, { before: "long-hero", after: "mid-hero" });

assert.throws(
  () => mutateGenome(base, {
    mutationId: "bad-logo",
    traitChanges: { emblem: "random-spider" },
    vocabulary: seed.vocabulary
  }),
  /canon-locked/
);

console.log(JSON.stringify({
  base: base.fingerprint,
  wearable: wearableA.fingerprint,
  parent: wearableA.parent,
  diff
}, null, 2));
console.log("Atelier Genome / HANA GH-01 smoke passed");
