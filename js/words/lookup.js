// Looking a word up (PLAN.md, the handshake): its sounds from the dictionary, which letters make each sound, and
// which part is said strongest. The dictionary (data/words/cmudict.dict, 3.6 MB) loads once, the first time.
import { align } from "./align.js";
import { normalizeWord, parseCmudict } from "./cmudict.js";

let loading = null;

// Loads the dictionary once. getText is passed in by the tests; the app uses fetch.
export function loadDictionary(getText = (url) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`Couldn't load the word list (${r.status}).`);
  return r.text();
})) {
  loading ??= getText(new URL("../../data/words/cmudict.dict", import.meta.url).href)
    .then(parseCmudict)
    .catch((err) => {
      loading = null; // let the next try start over
      throw err;
    });
  return loading;
}

// A typed word in a loaded dictionary, or null if it isn't there.
// → { word: "weather", phones: ["W", "EH1", "DH", "ER0"],
//     parts: [{ letters: "w", sounds: [0] }, { letters: "ea", sounds: [1] }, { letters: "th", sounds: [2] }, { letters: "er", sounds: [3] }],
//     stress: [1, 0], strong: 1 }
// sounds are indexes into phones ([] for a silent letter), stress has one number per vowel sound (1 strong,
// 2 medium, 0 weak), and strong is the index of the part with the strong vowel.
export function lookUpIn(dict, typed) {
  const word = normalizeWord(typed);
  const phones = dict.get(word)?.[0];
  if (!phones) return null;
  const parts = align(word, phones);
  return {
    word,
    phones,
    parts,
    stress: phones.filter((p) => /\d$/.test(p)).map((p) => Number(p.slice(-1))),
    strong: parts.findIndex((part) => part.sounds.some((i) => phones[i].endsWith("1"))),
  };
}

export async function lookUp(typed) {
  return lookUpIn(await loadDictionary(), typed);
}
