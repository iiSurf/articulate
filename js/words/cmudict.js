// Reads the CMU Pronouncing Dictionary (data/words/cmudict.dict) into a lookup from a word to the ways it's said.
// Each line is a word (lowercase, maybe with ' - or .), a "(2)" on its second way to be said, then its sounds, and
// sometimes a "# note":   live(2) L IH1 V
export function parseCmudict(text) {
  const dict = new Map();
  for (const line of text.split("\n")) {
    const m = /^([^\s(#]+)(?:\(\d+\))?\s+([A-Z][A-Z0-9 ]*?)\s*(?:#.*)?$/.exec(line.trim());
    if (!m) continue;
    if (!dict.has(m[1])) dict.set(m[1], []);
    dict.get(m[1]).push(m[2].split(/\s+/));
  }
  return dict;
}

// A typed word, ready to look up: lowercase, trimmed, with curly apostrophes made straight (a phone keyboard
// types ’ in "don’t").
export function normalizeWord(typed) {
  return String(typed).trim().toLowerCase().replace(/[’‘`]/g, "'");
}

// The ways a typed word is said, or [] if the dictionary doesn't have it.
export function pronunciations(dict, typed) {
  return dict.get(normalizeWord(typed)) || [];
}
