function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stable(value));
}

export function genomeHash(input) {
  const text = typeof input === "string" ? input : stableStringify(input);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(Number(value))));
}

function normalizeLocked(locked = []) {
  return [...new Set(locked.map(String))].sort();
}

export function createGenome({
  kind,
  seed,
  traits = {},
  continuous = {},
  locked = [],
  generation = 0,
  parent = null,
  canon = {}
} = {}) {
  if (!kind) throw new TypeError("kind is required");
  if (seed === undefined || seed === null) throw new TypeError("seed is required");
  if (!Number.isInteger(generation) || generation < 0) throw new TypeError("generation must be a non-negative integer");

  const genome = {
    schema: "atelier.genome.v1",
    kind: String(kind),
    seed: String(seed),
    generation,
    parent,
    locked: normalizeLocked(locked),
    canon: { ...canon },
    traits: { ...traits },
    continuous: Object.fromEntries(
      Object.entries(continuous).map(([key, value]) => [key, clamp(value)])
    )
  };
  genome.fingerprint = genomeFingerprint(genome);
  return genome;
}

export function genomeFingerprint(genome) {
  const core = {
    schema: genome.schema || "atelier.genome.v1",
    kind: genome.kind,
    seed: String(genome.seed),
    generation: Number(genome.generation || 0),
    parent: genome.parent || null,
    locked: normalizeLocked(genome.locked),
    canon: genome.canon || {},
    traits: genome.traits || {},
    continuous: genome.continuous || {}
  };
  return genomeHash(core);
}

function assertAllowed(key, value, vocabulary = {}) {
  const allowed = vocabulary[key];
  if (!allowed) return;
  if (!Array.isArray(allowed) || !allowed.includes(value)) {
    throw new TypeError(`Trait ${key}=${String(value)} is outside the allowed vocabulary`);
  }
}

export function mutateGenome(parent, {
  mutationId,
  traitChanges = {},
  continuousDeltas = {},
  vocabulary = {},
  lock = [],
  unlock = []
} = {}) {
  if (!parent || parent.schema !== "atelier.genome.v1") throw new TypeError("parent must be an atelier.genome.v1 object");
  if (!mutationId) throw new TypeError("mutationId is required");

  const currentLocked = new Set(parent.locked || []);
  for (const key of unlock) currentLocked.delete(String(key));
  for (const key of lock) currentLocked.add(String(key));

  const traits = { ...parent.traits };
  for (const [key, value] of Object.entries(traitChanges)) {
    if (currentLocked.has(key)) throw new Error(`Trait ${key} is canon-locked`);
    assertAllowed(key, value, vocabulary);
    traits[key] = value;
  }

  const continuous = { ...parent.continuous };
  for (const [key, delta] of Object.entries(continuousDeltas)) {
    if (currentLocked.has(key)) throw new Error(`Trait ${key} is canon-locked`);
    continuous[key] = clamp((Number(continuous[key]) || 0) + Number(delta || 0));
  }

  const child = createGenome({
    kind: parent.kind,
    seed: genomeHash(`${parent.fingerprint}:${mutationId}`),
    generation: parent.generation + 1,
    parent: parent.fingerprint,
    locked: [...currentLocked],
    canon: parent.canon,
    traits,
    continuous
  });

  return {
    ...child,
    mutation: {
      id: String(mutationId),
      traitChanges: { ...traitChanges },
      continuousDeltas: { ...continuousDeltas }
    }
  };
}

export function lineageRecord(genome) {
  if (!genome || genome.schema !== "atelier.genome.v1") throw new TypeError("genome is required");
  return {
    fingerprint: genome.fingerprint,
    parent: genome.parent,
    generation: genome.generation,
    kind: genome.kind,
    locked: [...(genome.locked || [])],
    mutation: genome.mutation || null
  };
}

export function compareGenomes(base, candidate) {
  if (!base || !candidate) throw new TypeError("base and candidate are required");
  const traitChanges = {};
  const continuousChanges = {};
  const traitKeys = new Set([...Object.keys(base.traits || {}), ...Object.keys(candidate.traits || {})]);
  const continuousKeys = new Set([...Object.keys(base.continuous || {}), ...Object.keys(candidate.continuous || {})]);

  for (const key of traitKeys) {
    if (base.traits?.[key] !== candidate.traits?.[key]) {
      traitChanges[key] = { before: base.traits?.[key], after: candidate.traits?.[key] };
    }
  }
  for (const key of continuousKeys) {
    const before = Number(base.continuous?.[key] || 0);
    const after = Number(candidate.continuous?.[key] || 0);
    if (before !== after) continuousChanges[key] = { before, after, delta: after - before };
  }
  return {
    base: base.fingerprint,
    candidate: candidate.fingerprint,
    sameCanon: stableStringify(base.canon || {}) === stableStringify(candidate.canon || {}),
    traitChanges,
    continuousChanges
  };
}
