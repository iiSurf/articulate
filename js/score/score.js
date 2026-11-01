// From a recording to a grade for each sound of a word (scoreSounds), and for each part of the word as it's
// spelled (scoreRecording, PLAN.md's score() in the handshake, which uses the Words part's lookUp() for the letters).
import { RATE, decodeRecording, trimSilence } from "./audio.js";
import { targets } from "./phones.js";
import { CUTS, logSoftmax, prepare, readVocab, scoreWord } from "./gop.js";

// samples: 16 kHz, between -1 and 1 (decodeRecording() in audio.js makes them from a recording).
// phones: the word's sounds from the dictionary, like ["TH", "IH1", "NG", "K"].
// model: from loadModel() in model.js, or a stand-in in the tests.
// Returns each sound (its grade, its score, and what it sounded like when it isn't green), what the model heard
// overall, how long the recording was before and after cutting the silence, and how long the scoring took.
export async function scoreSounds(samples, phones, model, cuts = CUTS) {
  const word = targets(phones);
  const kept = trimSilence(samples);
  const t0 = performance.now();
  const raw = await model.run(kept);
  const t1 = performance.now();
  const v = readVocab(model.vocab);
  const sounds = scoreWord(prepare(logSoftmax(raw), v), word, v, cuts).map((r, i) => ({ ...r, sound: word[i].ok[0] }));
  return {
    sounds,
    heard: heardAs(raw, model.vocab),
    seconds: { recorded: samples.length / RATE, scored: kept.length / RATE },
    ms: { model: t1 - t0, score: performance.now() - t1 },
  };
}

// What the model heard, sound by sound: its best guess for each 20 ms, with repeats and gaps taken out.
export function heardAs(raw, vocab) {
  const names = Object.fromEntries(Object.entries(vocab).map(([k, i]) => [i, k]));
  const skip = new Set(["[PAD]", "[UNK]", "|", " "]);
  const best = raw.map((row) => {
    let top = 0;
    for (let i = 1; i < row.length; i++) if (row[i] > row[top]) top = i;
    return top;
  });
  return best.filter((id, i) => id !== best[i - 1] && names[id] && !skip.has(names[id])).map((id) => names[id]);
}

// The vowels the scoring test found the model hears poorly (bad/bed, fool/full: docs/scoring-test.md). A part
// with one of them never shows better than yellow, and says it's unsure, so the app never claims more than it knows.
const UNSURE = new Set(["AE", "EH", "UW", "UH"]);
const WORSE = { green: 0, yellow: 1, orange: 2, red: 3 };

// PLAN.md's score(recording, word): a recording (a Blob from the microphone, or 16 kHz samples) and a typed word,
// to a grade for each part of the word as it's spelled. lookUp and loadModel come from the app (ctx.score passes
// them in, and the tests pass stand-ins). Everything scoreSounds() returns, plus:
//   word: "weather", strong: 1 (the part said strongest),
//   parts: [{ letters: "th", sounds: [2], grade: "red", heard: "d", unsure: false }, ...]
// A part's grade is its worst sound's grade; a silent letter has grade null.
export async function scoreRecording(recording, typed, { lookUp, loadModel, onProgress } = {}) {
  const found = await lookUp(typed);
  if (!found) throw new Error(`"${typed}" isn't in our word list yet.`);
  const samples = recording instanceof Float32Array ? recording : await decodeRecording(recording);
  const model = await loadModel({ onProgress });
  const result = await scoreSounds(samples, found.phones, model);
  const parts = found.parts.map((p) => {
    const sounds = p.sounds.map((i) => result.sounds[i]);
    const worst = sounds.reduce((w, s) => (!w || WORSE[s.grade] > WORSE[w.grade] ? s : w), null);
    const unsure = sounds.some((s) => UNSURE.has(s.cmu));
    const grade = worst && unsure && worst.grade === "green" ? "yellow" : worst?.grade ?? null;
    return { letters: p.letters, sounds: p.sounds, grade, heard: worst?.heard ?? null, unsure };
  });
  return { ...result, word: found.word, strong: found.strong, parts };
}
