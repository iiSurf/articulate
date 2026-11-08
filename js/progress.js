// Progress (iiSurf): what's remembered about each graded try, and the three boards and the hardest sounds worked out
// from it. Pure logic, no page, so it can be tested. The history is saved on the phone with everything else
// (js/store.js, "history") and never sent anywhere. The boards rank the learner's own words against each other.
//
// A try is { at, score, bad }:
//   at     when, as an ISO date and time
//   score  0 to 100, from the colored parts (scoreOf)
//   bad    the parts that went orange or red: [[sound, grade, letters], ...] with the sound as the tips file names it
import { soundKey } from "./words/tips.js";

export const MAX_TRIES = 30; // kept per word
export const MAX_WORDS = 80; // words kept; the one tried longest ago goes first
export const GOOD_ENOUGH = 80; // a word at or above this counts as said well (a star in a round)

// How much each grade counts. Silent letters have no grade and are skipped.
export const POINTS = { green: 1, yellow: 0.7, orange: 0.4, red: 0 };

// 0 to 100 for a word's parts, or null if none of them was graded.
export function scoreOf(parts) {
  const graded = parts.filter((p) => p.grade in POINTS);
  if (!graded.length) return null;
  return Math.round((100 * graded.reduce((sum, p) => sum + POINTS[p.grade], 0)) / graded.length);
}

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Remembers one graded try (scoreRecording's result). Returns the try, or null if nothing in it could be graded.
export function recordTry(state, result, now = new Date()) {
  const score = scoreOf(result.parts ?? []);
  if (score === null || !result.word) return null;
  const bad = result.parts
    .filter((p) => (p.grade === "orange" || p.grade === "red") && p.focusPhone)
    .map((p) => [soundKey(p.focusPhone), p.grade, p.letters]);
  const entry = { at: now.toISOString(), score, bad };
  const tries = (state.history[result.word] ??= []);
  tries.push(entry);
  if (tries.length > MAX_TRIES) tries.splice(0, tries.length - MAX_TRIES);
  const words = Object.keys(state.history);
  if (words.length > MAX_WORDS) {
    const oldest = words.sort((a, b) => state.history[a].at(-1).at.localeCompare(state.history[b].at(-1).at))[0];
    delete state.history[oldest];
  }
  return entry;
}

// What the boards know about one word.
function summarize(word, tries) {
  const scores = tries.map((t) => t.score), n = scores.length, last3 = scores.slice(-3);
  const k = Math.min(3, Math.floor(n / 2));
  const worst = [...tries.at(-1).bad].sort((a, b) => (a[1] === "red" ? 0 : 1) - (b[1] === "red" ? 0 : 1))[0] ?? null;
  return {
    word, tries: n,
    best: Math.max(...last3), // the best of the last three tries
    recent: Math.round(avg(last3)), // the average of the last three
    first: k ? Math.round(avg(scores.slice(0, k))) : null, // the first tries, never overlapping the last ones
    latest: k ? Math.round(avg(scores.slice(-k))) : null,
    spot: worst ? { sound: worst[0], grade: worst[1], letters: worst[2] } : null, // the part that went worst last time
  };
}
const all = (state) => Object.entries(state.history).filter(([, t]) => t.length).map(([w, t]) => summarize(w, t));
const byWord = (a, b) => a.word.localeCompare(b.word);

// Which color a score gets: good from 80, close from 60, a little off from 40, then needs work.
export const toneOf = (score) => (score >= 80 ? "good" : score >= 60 ? "close" : score >= 40 ? "off" : "work");

// Top words: the best of your last three tries, highest first. A word has to be close (60) or better to be on it.
export const TOP_FROM = 60;
export const topWords = (state, n = 5) => all(state).filter((w) => w.best >= TOP_FROM).sort((a, b) => b.best - a.best || b.tries - a.tries || byWord(a, b)).slice(0, n);

// Needs work: the average of your last three tries, lowest first, only for words not yet said well.
export const needsWork = (state, n = 5) => all(state).filter((w) => w.recent < GOOD_ENOUGH).sort((a, b) => a.recent - b.recent || byWord(a, b)).slice(0, n);

// Most improved: the last tries against the first ones, biggest jump first. A word needs two tries and a gain of 10.
export const MIN_GAIN = 10;
export const mostImproved = (state, n = 5) => all(state)
  .filter((w) => w.first !== null && w.latest - w.first >= MIN_GAIN)
  .map((w) => ({ ...w, gain: w.latest - w.first }))
  .sort((a, b) => b.gain - a.gain || byWord(a, b)).slice(0, n);

// The sounds that went orange or red most often, across every kept try: [{ sound, misses, words }].
export function hardestSounds(state, n = 4) {
  const found = new Map();
  for (const [word, tries] of Object.entries(state.history)) {
    for (const t of tries) {
      for (const [sound] of t.bad) {
        const f = found.get(sound) ?? { sound, misses: 0, words: new Map() };
        f.misses++;
        f.words.set(word, (f.words.get(word) ?? 0) + 1);
        found.set(sound, f);
      }
    }
  }
  return [...found.values()].map((f) => ({ sound: f.sound, misses: f.misses, words: [...f.words].sort((a, b) => b[1] - a[1]).map(([w]) => w) }))
    .sort((a, b) => b.misses - a.misses || a.sound.localeCompare(b.sound)).slice(0, n);
}

// The five words of a round for one sound: the learner's own word that gave them the most trouble with it first (so it
// can climb the boards), then words with that sound from the tips file, the start of a word first.
export function roundWords(tips, state, sound, size = 5) {
  const entry = tips?.sounds?.[sound];
  if (!entry) return [];
  const own = hardestSounds(state, 99).find((h) => h.sound === sound)?.words[0];
  const listed = ["start", "middle", "end"].flatMap((spot) => entry.words?.[spot] ?? []);
  return [own, ...listed].filter((w, i, xs) => w && xs.indexOf(w) === i).slice(0, size);
}

// Stars for a round: one for each word said well enough. results is [{ word, score }] (the best try of each word).
export const stars = (results) => results.filter((r) => r.score >= GOOD_ENOUGH).length;
