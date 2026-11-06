// The logic behind Listen and Read (the teammate's Practice part): picking a round and checking an answer.
// No page and no sound here, so it can be tested. Words come from lookUp() (js/words/lookup.js):
// { word, phones, parts: [{ letters, sounds: [i] }], stress, strong }.
import { PAIRS } from "./lists.js";

const bare = (p) => p.replace(/\d$/, "");
const pick = (list, rand = Math.random) => list[Math.floor(rand() * list.length)];

// --- Listen ---

// One round: a pair of words, and the one the phone will say. Pairs with one of the learner's own words come
// up more often. → { sound, tip, words: ["sheep", "ship"], target: "ship" }
export function listenRound(ownWords = [], rand = Math.random) {
  const own = new Set(ownWords.map((w) => w.toLowerCase()));
  const all = PAIRS.flatMap((g) => g.words.map((words) => ({ sound: g.sound, tip: g.tip, words })));
  const mine = all.filter((r) => r.words.some((w) => own.has(w)));
  const pool = mine.length && rand() < 0.5 ? mine : all;
  const round = pick(pool, rand);
  const words = rand() < 0.5 ? [...round.words] : [...round.words].reverse();
  return { ...round, words, target: pick(words, rand) };
}

// --- Read: find the strong part ---

// The parts that hold a vowel sound, which are the ones worth tapping. A word needs two or more.
export function vowelParts(found) {
  return found.parts
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.sounds.some((s) => /\d$/.test(found.phones[s])));
}
export const canStrong = (found) => !!found && vowelParts(found).length >= 2 && found.strong >= 0;

// --- Read: spot the small "uh" ---

// The parts said as a small, weak "uh" (AH0).
export function uhParts(found) {
  return found.parts.map((p, i) => (p.sounds.some((s) => found.phones[s] === "AH0") ? i : -1)).filter((i) => i >= 0);
}
export const canUh = (found) => !!found && uhParts(found).length > 0 && vowelParts(found).length >= 2;

// Right if they tapped exactly the "uh" parts.
export function checkUh(found, tapped) {
  const want = uhParts(found);
  const got = [...new Set(tapped)].sort((a, b) => a - b);
  return want.length === got.length && want.every((v, k) => v === got[k]);
}

// --- Read: same sound? ---

// The part of a word spelled with these letters (the first one), with its sounds without stress numbers.
export function soundsOf(found, letters) {
  const i = found.parts.findIndex((p) => p.letters === letters);
  if (i < 0) return null;
  return { i, sounds: found.parts[i].sounds.map((s) => bare(found.phones[s])) };
}

// Whether the marked letters of two words sound the same. null if the letters can't be found.
export function sameSound(a, lettersA, b, lettersB) {
  const x = soundsOf(a, lettersA), y = soundsOf(b, lettersB);
  if (!x || !y) return null;
  return x.sounds.join(" ") === y.sounds.join(" ");
}

export const READ_KINDS = ["strong", "uh", "same"];
