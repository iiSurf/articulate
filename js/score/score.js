// From a recording to a grade for each sound of a word. This is the scoring half of PLAN.md's handshake; the
// letters that go with each sound come with the Words part's lookUp(). For now it takes the word's sounds.
import { RATE, trimSilence } from "./audio.js";
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
