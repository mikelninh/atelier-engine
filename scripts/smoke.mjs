import assert from "node:assert/strict";
import {
  OPTION_SETS,
  WORLDS,
  createWorldSneaker,
  generateDescendants,
  getGameStats,
  getRarity,
  getSneakerName,
  mutateSneaker,
  randomizeSneaker,
  setSneakerWorld,
  sneakerFingerprint,
} from "../src/sneakerEngine.js";

const sky = createWorldSneaker("sky", 12345);
assert.equal(sky.world, "sky");
assert.ok(WORLDS.sky.palettes.includes(sky.palette));

const ember = setSneakerWorld(sky, "ember");
assert.equal(ember.world, "ember");
assert.ok(WORLDS.ember.palettes.includes(ember.palette));

const technical = mutateSneaker(ember, "technical", 2, 7);
for (const key of ["sole", "upper", "toe", "heel", "lacing", "material", "palette"]) {
  assert.ok(OPTION_SETS[key].includes(technical[key]), key + " must stay in vocabulary");
}
assert.ok(WORLDS.ember.palettes.includes(technical.palette));

const children = generateDescendants(technical, "wild", 8);
assert.equal(children.length, 4);
assert.equal(new Set(children.map(sneakerFingerprint)).size, 4);

const rarityA = getRarity(technical);
const rarityB = getRarity({ ...technical });
assert.deepEqual(rarityA, rarityB);

const nameA = getSneakerName(technical);
const nameB = getSneakerName({ ...technical });
assert.equal(nameA, nameB);
assert.ok(nameA.includes(" "));

const stats = getGameStats(technical);
for (const value of Object.values(stats)) {
  assert.ok(value >= 0 && value <= 100, "stats must be bounded");
}

const randomized = randomizeSneaker(ember, 999);
assert.equal(randomized.world, "ember");
assert.ok(WORLDS.ember.palettes.includes(randomized.palette));

console.log("RIFTSOLE smoke tests passed");
