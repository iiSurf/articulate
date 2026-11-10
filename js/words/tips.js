// The tips for "Fix this part" (iiSurf's Words part): for the sound that went wrong, how to make it starting from a
// sound the learner already knows (data/tips/uk-en.json, Ukrainian to English), what they said instead, words with the
// same sound in the same spot, and pairs to hear the difference. Pure logic here, with tests; the data is a file so
// another first language is a new file, not new code. Nothing in this file touches the page.

let loading = null;

// Loads the tips once (the first time they're asked for). getJson is passed in by the tests.
export function loadTips(getJson = (url) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`Couldn't load the tips (${r.status}).`);
  return r.json();
})) {
  loading ??= getJson(new URL("../../data/tips/uk-en.json", import.meta.url).href).catch((err) => {
    loading = null; // let the next try start over
    throw err;
  });
  return loading;
}

// The key a dictionary sound is filed under. The vowel in "cut" and the small "uh" in "about" are both AH to the
// dictionary but need different tips, so AH is split by its stress number (0 is the small one).
export function soundKey(dictionaryPhone) {
  const base = String(dictionaryPhone).replace(/\d/g, "");
  return base === "AH" ? (/0$/.test(dictionaryPhone) ? "AH0" : "AH1") : base;
}

// Where a sound sits in a word: its first sound, its last, or somewhere in between.
export function positionOf(index, count) {
  return index === 0 ? "start" : index === count - 1 ? "end" : "middle";
}

const MAX_WORDS = 4, MAX_PAIRS = 2;

// What to show for one part of a word that went wrong. part comes from scoreRecording (js/score/score.js):
//   { letters, focusPhone: "TH" (the sound that was graded worst, as in the dictionary), position, heard, grade }
// Returns null when there is nothing to say about that sound. Otherwise:
//   { sound: "TH" (the key, for the round at #/round/TH), title: "th as in think", uk: { letter, word } | null, tip, swap: what they said instead (or null),
//     words: up to 4 with the same sound, the same spot first (never the word itself),
//     pairs: up to 2 pairs to hear the difference between, a pair with the word itself first }
export function fixTip(data, part, word = "") {
  const key = soundKey(part?.focusPhone ?? "");
  const entry = data?.sounds?.[key];
  if (!entry) return null;
  const swap = part.heard === "" ? data.missing ?? null : part.heard ? data.swaps?.[`${key}>${part.heard}`] ?? null : null;
  const here = entry.words?.[part.position] ?? [];
  const others = ["start", "middle", "end"].filter((p) => p !== part.position).flatMap((p) => entry.words?.[p] ?? []);
  const words = [...here, ...others].filter((w, i, all) => w !== word && all.indexOf(w) === i).slice(0, MAX_WORDS);
  // Pairs with their own word come first: hearing it next to the word they said by mistake is the most useful one.
  const all = entry.pairs ?? [];
  const pairs = [...all.filter((p) => p.includes(word)), ...all.filter((p) => !p.includes(word))].slice(0, MAX_PAIRS);
  return { sound: key, title: entry.title, uk: entry.uk ?? null, tip: entry.tip, swap, words, pairs };
}

// The sounds that are hardest for a Ukrainian speaker, hardest first (docs/needs.md): the order a word's page picks
// from when it explains one sound.
export const TEACH_ORDER = ["TH", "DH", "W", "V", "R", "NG", "IH", "IY", "AE", "EH", "UH", "UW", "OW", "AO", "ER", "AH0", "AH1", "AA", "HH", "P", "T", "K"];

// The one sound to explain on a word's page: the one that went wrong last time (lastBad, a tips key), if the word has
// it; otherwise its hardest sound for a Ukrainian speaker; null if the word has none of the sounds with tips.
// phones are the dictionary's sounds for the word ("TH", "IH1", ...).
export function soundToTeach(data, phones, lastBad = null) {
  const keys = new Set((phones ?? []).map(soundKey).filter((k) => data?.sounds?.[k]));
  if (lastBad && keys.has(lastBad)) return lastBad;
  return TEACH_ORDER.find((k) => keys.has(k)) ?? null;
}

// Splits a sentence into runs of Ukrainian letters and everything else, so a screen can mark the Ukrainian with
// lang="uk" (a screen reader then reads it in Ukrainian, not in an English voice). [{ text, uk: true | false }]
export function segments(text) {
  return String(text).split(/([Ѐ-ӿ]+(?:[ '’-][Ѐ-ӿ]+)*)/).filter(Boolean)
    .map((t) => ({ text: t, uk: /[Ѐ-ӿ]/.test(t) }));
}
