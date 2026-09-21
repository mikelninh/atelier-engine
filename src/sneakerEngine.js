export const PALETTES = {
  sky: { name: "Volt", primary: "#f5f2e8", secondary: "#255ee8", accent: "#ffd83d", sole: "#e7edf7", world: "sky" },
  storm: { name: "Storm", primary: "#dce8ff", secondary: "#163d9b", accent: "#76e7ff", sole: "#eef5ff", world: "sky" },
  celestial: { name: "Celestial", primary: "#fff8df", secondary: "#4462c7", accent: "#f7c94a", sole: "#f3efe5", world: "sky" },
  ember: { name: "Ember", primary: "#171313", secondary: "#9d1f20", accent: "#ffb42e", sole: "#2a2020", world: "ember" },
  inferno: { name: "Inferno", primary: "#0e0d0f", secondary: "#d3351f", accent: "#ff6a1a", sole: "#231719", world: "ember" },
  obsidian: { name: "Obsidian", primary: "#211b20", secondary: "#6e232a", accent: "#e8b45d", sole: "#34272b", world: "ember" },
  moss: { name: "Moss", primary: "#eee6d3", secondary: "#315735", accent: "#b8914e", sole: "#d8d1bd", world: "moss" },
  canopy: { name: "Canopy", primary: "#dfe5cf", secondary: "#476b37", accent: "#e3cc65", sole: "#cbd5b8", world: "moss" },
  fern: { name: "Fern", primary: "#ece7da", secondary: "#214931", accent: "#8fcf60", sole: "#dbdacb", world: "moss" },
};

export const WORLDS = {
  sky: {
    id: "sky",
    name: "Skyrealm",
    icon: "✦",
    tagline: "Higher. Further. Brighter.",
    description: "Electric speed, celestial runners and impossible altitude.",
    palettes: ["sky", "storm", "celestial"],
    defaults: { sole: "sculpted", upper: "exo", toe: "round", heel: "frame", lacing: "speed", material: "mesh", palette: "sky", soleBoldness: 58, upperComplexity: 64, asymmetry: 22 },
    css: { glow: "#42a5ff", glow2: "#ffe34f", panel: "#071d49" },
  },
  ember: {
    id: "ember",
    name: "Emberland",
    icon: "◆",
    tagline: "Bolder. Hotter. Deeper.",
    description: "Night runners forged in heat, shadow and molten light.",
    palettes: ["ember", "inferno", "obsidian"],
    defaults: { sole: "split", upper: "panelled", toe: "sharp", heel: "fin", lacing: "cross", material: "knit", palette: "ember", soleBoldness: 72, upperComplexity: 78, asymmetry: 48 },
    css: { glow: "#ff5b22", glow2: "#ffc642", panel: "#3a0b0d" },
  },
  moss: {
    id: "moss",
    name: "Mossreach",
    icon: "❖",
    tagline: "Wilder. Greener. Together.",
    description: "Trail relics reclaimed by roots, rain and ancient stone.",
    palettes: ["moss", "canopy", "fern"],
    defaults: { sole: "wave", upper: "sock", toe: "round", heel: "halo", lacing: "classic", material: "bio", palette: "moss", soleBoldness: 66, upperComplexity: 70, asymmetry: 30 },
    css: { glow: "#67dd70", glow2: "#e4ca63", panel: "#0c392a" },
  },
};

export const OPTION_SETS = {
  sole: ["quiet", "sculpted", "split", "wave"],
  upper: ["mono", "panelled", "sock", "exo"],
  toe: ["round", "sharp", "split"],
  heel: ["low", "fin", "halo", "frame"],
  lacing: ["classic", "speed", "hidden", "cross"],
  material: ["knit", "suede", "bio", "mesh"],
  palette: Object.keys(PALETTES),
};

export const DIRECTIONS = [
  { id: "sleeker", label: "Sleeker", hint: "reduce visual mass" },
  { id: "wearable", label: "Wearable", hint: "calm risky details" },
  { id: "stranger", label: "Stranger", hint: "push silhouette surprise" },
  { id: "technical", label: "Technical", hint: "engineered structure" },
  { id: "luxury", label: "Luxury", hint: "restrained premium language" },
  { id: "wild", label: "Wild", hint: "explore a new branch" },
];

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function hash(input) {
  let h = 2166136261;
  const value = String(input);
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function pick(list, token) {
  return list[hash(token) % list.length];
}

function pickDifferent(list, current, token) {
  const choices = list.filter((value) => value !== current);
  return pick(choices.length ? choices : list, token);
}

export function createWorldSneaker(worldId = "sky", seed = 1107) {
  const world = WORLDS[worldId] || WORLDS.sky;
  return { ...world.defaults, world: world.id, seed };
}

export function createInitialSneaker() {
  return createWorldSneaker("sky", 1107);
}

function profileFor(direction) {
  return ({
    sleeker: { sole: -16, complexity: -14, asymmetry: -8, keys: ["sole", "upper", "heel"] },
    wearable: { sole: -8, complexity: -18, asymmetry: -16, keys: ["toe", "heel", "lacing"] },
    stranger: { sole: 10, complexity: 16, asymmetry: 22, keys: ["toe", "heel", "upper"] },
    technical: { sole: 8, complexity: 20, asymmetry: 8, keys: ["upper", "lacing", "sole"] },
    luxury: { sole: -2, complexity: -7, asymmetry: -3, keys: ["material", "heel"] },
    wild: { sole: 7, complexity: 11, asymmetry: 14, keys: ["sole", "upper", "toe", "heel", "lacing"] },
  })[direction] || { sole: 6, complexity: 10, asymmetry: 12, keys: ["sole", "upper", "heel"] };
}

export function mutateSneaker(parent, direction = "wild", variant = 0, generation = 0) {
  const profile = profileFor(direction);
  const token = [parent.seed, parent.world, direction, variant, generation].join(":");
  const jitter = (key) => (hash(token + ":" + key) % 13) - 6;
  const next = {
    ...parent,
    seed: hash(token) % 1000000,
    soleBoldness: clamp(parent.soleBoldness + profile.sole + jitter("sole")),
    upperComplexity: clamp(parent.upperComplexity + profile.complexity + jitter("complexity")),
    asymmetry: clamp(parent.asymmetry + profile.asymmetry + jitter("asymmetry")),
  };

  const categoricalChanges = variant === 0 ? 1 : variant === 3 ? 3 : 2;
  for (let i = 0; i < categoricalChanges; i += 1) {
    const key = profile.keys[(hash(token + ":key:" + i) + i) % profile.keys.length];
    next[key] = pickDifferent(OPTION_SETS[key], next[key], token + ":" + key + ":" + i);
  }

  const world = WORLDS[next.world] || WORLDS.sky;
  if (direction === "wild" || variant === 3) {
    next.palette = pick(world.palettes, token + ":palette");
  }
  if (direction === "technical") next.material = pick(["mesh", "knit"], token + ":material");
  if (direction === "luxury") next.material = pick(["suede", "bio"], token + ":material");
  if (direction === "wearable" && next.heel === "fin") next.heel = "low";
  return next;
}

export function generateDescendants(parent, direction, generation) {
  return [0, 1, 2, 3].map((variant) => mutateSneaker(parent, direction, variant, generation));
}

export function randomizeSneaker(parent, salt = Date.now()) {
  const world = WORLDS[parent.world] || WORLDS.sky;
  const token = parent.seed + ":" + salt;
  return {
    ...parent,
    seed: hash(token),
    sole: pick(OPTION_SETS.sole, token + "sole"),
    upper: pick(OPTION_SETS.upper, token + "upper"),
    toe: pick(OPTION_SETS.toe, token + "toe"),
    heel: pick(OPTION_SETS.heel, token + "heel"),
    lacing: pick(OPTION_SETS.lacing, token + "lace"),
    material: pick(OPTION_SETS.material, token + "material"),
    palette: pick(world.palettes, token + "palette"),
    soleBoldness: 38 + (hash(token + "sb") % 51),
    upperComplexity: 38 + (hash(token + "uc") % 55),
    asymmetry: 8 + (hash(token + "as") % 68),
  };
}

export function sneakerFingerprint(sneaker) {
  return [
    sneaker.world, sneaker.sole, sneaker.upper, sneaker.toe, sneaker.heel,
    sneaker.lacing, sneaker.material, sneaker.palette,
    sneaker.soleBoldness, sneaker.upperComplexity, sneaker.asymmetry, sneaker.seed,
  ].join("|");
}

export function getRarity(sneaker) {
  const roll = hash(sneakerFingerprint(sneaker) + ":rarity") % 100;
  if (roll >= 96) return { id: "mythic", label: "MYTHIC", rank: 5, gem: "✦", color: "#ffdf69" };
  if (roll >= 86) return { id: "legendary", label: "LEGENDARY", rank: 4, gem: "◆", color: "#ff8b34" };
  if (roll >= 65) return { id: "epic", label: "EPIC", rank: 3, gem: "♦", color: "#c174ff" };
  if (roll >= 34) return { id: "rare", label: "RARE", rank: 2, gem: "◇", color: "#48b9ff" };
  return { id: "common", label: "COMMON", rank: 1, gem: "◈", color: "#c9d0d9" };
}

export function getGameStats(sneaker) {
  const world = sneaker.world || "sky";
  const speedBias = world === "sky" ? 12 : world === "ember" ? 6 : -1;
  const gripBias = world === "moss" ? 14 : world === "ember" ? 4 : 1;
  const styleBias = world === "ember" ? 10 : world === "sky" ? 5 : 4;
  return {
    speed: clamp(54 + speedBias + (100 - sneaker.soleBoldness) * .17 + (sneaker.lacing === "speed" ? 8 : 0)),
    style: clamp(48 + styleBias + sneaker.upperComplexity * .32 + sneaker.asymmetry * .18),
    grip: clamp(52 + gripBias + sneaker.soleBoldness * .28 + (sneaker.sole === "sculpted" || sneaker.sole === "wave" ? 7 : 0)),
  };
}

export function scoreSneaker(sneaker) {
  const novelty = clamp(30 + sneaker.upperComplexity * .4 + sneaker.asymmetry * .32 + (sneaker.heel === "fin" ? 10 : 0));
  const wearablePenalty = Math.max(0, sneaker.asymmetry - 52) * .35 + Math.max(0, sneaker.upperComplexity - 82) * .18;
  const wearability = clamp(95 - wearablePenalty);
  const production = clamp(94 - sneaker.upperComplexity * .17 - sneaker.asymmetry * .13 - (sneaker.sole === "split" ? 7 : 0));
  return { novelty, wearability, production };
}

export function estimatePrice(sneaker) {
  const material = { knit: 28, suede: 44, bio: 48, mesh: 34 }[sneaker.material] || 30;
  const rarity = getRarity(sneaker).rank;
  return 168 + material + Math.round(sneaker.soleBoldness * .36 + sneaker.upperComplexity * .22) + rarity * 6;
}

const NAME_PARTS = {
  sky: {
    first: ["Volt", "Halo", "Nimbus", "Aero", "Prism", "Orbit", "Nova", "Sky"],
    second: ["Sprint", "Arc", "Runner", "Pulse", "Drift", "Flux", "Glide", "Vector"],
  },
  ember: {
    first: ["Ember", "Cinder", "Obsidian", "Pyre", "Crimson", "Ash", "Flare", "Night"],
    second: ["Shade", "Rush", "Forge", "Fang", "Pulse", "Rift", "Stride", "Core"],
  },
  moss: {
    first: ["Moss", "Fern", "Canopy", "Root", "Verdant", "Grove", "Wild", "Cedar"],
    second: ["Bound", "Trail", "Hi", "Stride", "Roam", "Bloom", "Path", "Ridge"],
  },
};

export function getSneakerName(sneaker) {
  const parts = NAME_PARTS[sneaker.world] || NAME_PARTS.sky;
  const token = sneakerFingerprint(sneaker);
  return pick(parts.first, token + ":first") + " " + pick(parts.second, token + ":second");
}

export function getFlavorText(sneaker) {
  const lines = {
    sky: ["A spark in every step.", "Built for impossible altitude.", "Runs where horizons begin.", "Gravity was only a suggestion."],
    ember: ["Moves like a whispered fire.", "Leave heat, not hesitation.", "Forged after midnight.", "Every shadow needs a spark."],
    moss: ["Rooted, but never still.", "Find the trail that was not there.", "Made for the long way home.", "The wild remembers every step."],
  };
  return pick(lines[sneaker.world] || lines.sky, sneakerFingerprint(sneaker) + ":flavor");
}

export function setSneakerWorld(sneaker, worldId) {
  const seed = hash(sneaker.seed + ":world:" + worldId);
  const fresh = createWorldSneaker(worldId, seed);
  return { ...fresh, material: sneaker.material };
}

export function buildTasteProfile(history) {
  if (!history.length) return { signal: "Make a few choices to teach the generator your taste.", confidence: 0 };
  const latest = history.slice(-10);
  const avg = (key) => Math.round(latest.reduce((sum, item) => sum + Number(item[key] || 0), 0) / latest.length);
  const counts = (key) => latest.reduce((acc, item) => ({ ...acc, [item[key]]: (acc[item[key]] || 0) + 1 }), {});
  const favourite = (key) => Object.entries(counts(key)).sort((a, b) => b[1] - a[1])[0]?.[0];
  return {
    signal: [favourite("world") + " world", favourite("sole") + " sole", avg("asymmetry") > 46 ? "bold asymmetry" : "balanced geometry", favourite("material")].join(" · "),
    confidence: clamp(18 + latest.length * 8, 0, 94),
  };
}

export function buildJevDecisionContext(parent, direction, tasteProfile) {
  return {
    task: "Choose the next coherent RIFTSOLE sneaker mutation",
    direction,
    current: parent,
    taste: tasteProfile,
    allowed: OPTION_SETS,
    world: WORLDS[parent.world],
    constraints: [
      "return only supported values",
      "preserve the selected world identity",
      "change one to three categorical traits",
      "preserve recognisable parent DNA",
    ],
  };
}
