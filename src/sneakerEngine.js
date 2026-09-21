export const PALETTES = {
  moon: { name: "Moon", primary: "#e9e4d8", secondary: "#b8afa0", accent: "#24211d", sole: "#f6f1e8" },
  ember: { name: "Ember", primary: "#2a1714", secondary: "#7b2d24", accent: "#e6a36e", sole: "#d8c3ad" },
  moss: { name: "Moss", primary: "#d9ddcf", secondary: "#586b56", accent: "#1f2822", sole: "#ece8dd" },
  cobalt: { name: "Cobalt", primary: "#121820", secondary: "#315f9b", accent: "#d9e6ff", sole: "#d9d4c9" },
  plum: { name: "Plum", primary: "#ded0d9", secondary: "#6e475f", accent: "#231921", sole: "#efe7df" },
  citrus: { name: "Citrus", primary: "#d9dfb1", secondary: "#9da72f", accent: "#292b19", sole: "#eee9db" },
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
  { id: "sleeker", label: "Sleeker", hint: "less visual mass" },
  { id: "wearable", label: "More wearable", hint: "calm the risky details" },
  { id: "stranger", label: "Stranger", hint: "push silhouette surprise" },
  { id: "technical", label: "More technical", hint: "engineered structure" },
  { id: "luxury", label: "More luxurious", hint: "restrained premium language" },
  { id: "wild", label: "Surprise me", hint: "explore a new branch" },
];

const INITIAL = {
  sole: "sculpted",
  upper: "exo",
  toe: "round",
  heel: "frame",
  lacing: "speed",
  material: "mesh",
  palette: "moon",
  soleBoldness: 58,
  upperComplexity: 62,
  asymmetry: 24,
  seed: 11,
};

export function createInitialSneaker() {
  return { ...INITIAL };
}

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function hash(input) {
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
  const candidates = list.filter((item) => item !== current);
  return pick(candidates.length ? candidates : list, token);
}

function profileFor(direction) {
  return ({
    sleeker: { sole: -18, complexity: -16, asymmetry: -8, keys: ["sole", "upper", "heel"] },
    wearable: { sole: -10, complexity: -20, asymmetry: -18, keys: ["toe", "heel", "lacing"] },
    stranger: { sole: 12, complexity: 16, asymmetry: 24, keys: ["toe", "heel", "upper"] },
    technical: { sole: 9, complexity: 22, asymmetry: 6, keys: ["upper", "lacing", "sole"] },
    luxury: { sole: -3, complexity: -9, asymmetry: -4, keys: ["material", "palette", "heel"] },
    wild: { sole: 8, complexity: 12, asymmetry: 16, keys: ["sole", "upper", "toe", "heel", "lacing", "palette"] },
  })[direction] || { sole: 8, complexity: 12, asymmetry: 16, keys: ["sole", "upper", "heel"] };
}

export function mutateSneaker(parent, direction = "wild", variant = 0, generation = 0) {
  const profile = profileFor(direction);
  const token = [parent.seed, direction, variant, generation].join(":");
  const jitter = (offset) => (hash(token + ":" + offset) % 13) - 6;
  const next = {
    ...parent,
    seed: hash(token) % 100000,
    soleBoldness: clamp(parent.soleBoldness + profile.sole + jitter("sole")),
    upperComplexity: clamp(parent.upperComplexity + profile.complexity + jitter("complexity")),
    asymmetry: clamp(parent.asymmetry + profile.asymmetry + jitter("asymmetry")),
  };

  const changes = variant === 0 ? 1 : variant === 1 ? 2 : variant === 2 ? 2 : 3;
  for (let i = 0; i < changes; i += 1) {
    const key = profile.keys[(hash(token + ":key:" + i) + i) % profile.keys.length];
    next[key] = pickDifferent(OPTION_SETS[key], next[key], token + ":" + key + ":" + i);
  }

  if (direction === "luxury" && variant % 2 === 0) next.material = pick(["suede", "bio"], token + ":lux-material");
  if (direction === "technical") next.material = pick(["mesh", "knit"], token + ":tech-material");
  if (direction === "wearable" && next.heel === "fin") next.heel = "low";
  if (direction === "sleeker" && next.sole === "wave") next.sole = "quiet";

  return next;
}

export function generateDescendants(parent, direction, generation) {
  return [0, 1, 2, 3].map((variant) => mutateSneaker(parent, direction, variant, generation));
}

export function sneakerFingerprint(sneaker) {
  return [
    sneaker.sole, sneaker.upper, sneaker.toe, sneaker.heel,
    sneaker.lacing, sneaker.material, sneaker.palette,
    sneaker.soleBoldness, sneaker.upperComplexity, sneaker.asymmetry,
  ].join("|");
}

export function scoreSneaker(sneaker) {
  const wearablePenalty = Math.max(0, sneaker.asymmetry - 55) * 0.28 + Math.max(0, sneaker.soleBoldness - 78) * 0.22;
  const novelty = clamp(28 + sneaker.upperComplexity * 0.38 + sneaker.asymmetry * 0.34 + (sneaker.heel === "fin" ? 12 : 0));
  const wearability = clamp(96 - wearablePenalty - Math.max(0, sneaker.upperComplexity - 78) * 0.16);
  const production = clamp(94 - sneaker.upperComplexity * 0.18 - sneaker.asymmetry * 0.12 - (sneaker.sole === "split" ? 7 : 0));
  return { novelty, wearability, production };
}

export function estimatePrice(sneaker) {
  const material = { knit: 26, suede: 42, bio: 48, mesh: 32 }[sneaker.material] || 30;
  return 159 + material + Math.round(sneaker.soleBoldness * 0.42 + sneaker.upperComplexity * 0.25);
}

export function buildTasteProfile(history) {
  if (!history.length) return { signal: "No taste signal yet", confidence: 0 };
  const latest = history.slice(-8);
  const avg = (key) => Math.round(latest.reduce((sum, item) => sum + item[key], 0) / latest.length);
  const counts = (key) => latest.reduce((acc, item) => ({ ...acc, [item[key]]: (acc[item[key]] || 0) + 1 }), {});
  const favourite = (key) => Object.entries(counts(key)).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    signal: [
      favourite("sole") + " sole",
      favourite("upper") + " upper",
      avg("asymmetry") > 48 ? "asymmetric" : "balanced",
      favourite("material"),
    ].join(" · "),
    confidence: clamp(20 + latest.length * 10, 0, 92),
  };
}

// This object is the server-side seam for real Jev.
// Feed the current sneaker + taste history to Jev, constrain each output to
// OPTION_SETS, then return one valid sneaker state to the client.
export function buildJevDecisionContext(parent, direction, tasteProfile) {
  return {
    task: "Choose the next coherent sneaker mutation",
    direction,
    current: parent,
    taste: tasteProfile,
    allowed: OPTION_SETS,
    constraints: [
      "return only supported values",
      "change one to three categorical traits",
      "preserve recognisable parent DNA",
      "avoid impossible combinations",
    ],
  };
}
