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
// phones can also be a list of ways to say the word (each a list of sounds): the model runs once, every way is
// scored, and the one that fits best is kept, with its index as `way`.
export async function scoreSounds(samples, phones, model, cuts = CUTS) {
  const ways = Array.isArray(phones[0]) ? phones : [phones];
  const kept = trimSilence(samples);
  const t0 = performance.now();
  const raw = await model.run(kept);
  const t1 = performance.now();
  const v = readVocab(model.vocab);
  const prep = prepare(logSoftmax(raw), v);
  let best = null;
  ways.forEach((p, way) => {
    const word = targets(p);
    const sounds = scoreWord(prep, word, v, cuts).map((r, i) => ({ ...r, sound: word[i].ok[0] }));
    if (!best || better(sounds, best.sounds)) best = { sounds, way };
  });
  return {
    sounds: best.sounds,
    way: best.way,
    heard: heardAs(raw, model.vocab),
    seconds: { recorded: samples.length / RATE, scored: kept.length / RATE },
    ms: { model: t1 - t0, score: performance.now() - t1 },
  };
}

// Which of two ways of saying a word was said: fewer red and orange sounds, then the higher average score.
function better(a, b) {
  const bad = (s) => s.reduce((n, r) => n + WORSE[r.grade], 0);
  if (bad(a) !== bad(b)) return bad(a) < bad(b);
  const mean = (s) => s.reduce((n, r) => n + r.score, 0) / s.length;
  return mean(a) > mean(b);
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

// The vowels the scoring test found the model hears poorly (bad/bed, fool/full: docs/scoring-test.md), each with
// the vowel it mixes up. A green one is shown as yellow, and unsure, only when this try's closest other sound was
// that partner and it won by less than UNSURE_MARGIN: then the app can't be sure which was said. When the model
// clearly heard the right vowel, it stays green ("very" and "weather" can be all green).
// Check UNSURE_MARGIN with real voices, like the color cuts.
const PARTNER = { AE: "ɛ", EH: "æ", UW: "ʊ", UH: "u" };
export const UNSURE_MARGIN = 1;
const WORSE = { green: 0, yellow: 1, orange: 2, red: 3 };

// PLAN.md's score(recording, word): a recording (a Blob from the microphone, or 16 kHz samples) and a typed word,
// to a grade for each part of the word as it's spelled. lookUp and loadModel come from the app (ctx.score passes
// them in, and the tests pass stand-ins). Everything scoreSounds() returns, plus:
//   word: "weather", strong: 1 (the part said strongest),
//   parts: [{ letters: "th", sounds: [2], grade: "red", heard: "d", unsure: false,
//             focusPhone: "DH", position: "start" }, ...]
// A part's grade is its worst sound's grade; a silent letter has grade null. focusPhone is that worst sound as the
// dictionary writes it (with its stress number, like "AH0"), and position is where it sits in the word: start, middle,
// or end. js/words/tips.js uses them to pick the tip for Fix this part.
export async function scoreRecording(recording, typed, { lookUp, loadModel, onProgress } = {}) {
  const found = await lookUp(typed);
  if (!found) throw new Error(`"${typed}" isn't in our word list yet.`);
  const samples = recording instanceof Float32Array ? recording : await decodeRecording(recording);
  const model = await loadModel({ onProgress });
  const ways = found.ways || [found];
  const result = await scoreSounds(samples, ways.map((w) => w.phones), model);
  const said = ways[result.way];
  const parts = said.parts.map((p) => {
    const sounds = p.sounds.map((i) => result.sounds[i]);
    const worst = sounds.reduce((w, s) => (!w || WORSE[s.grade] > WORSE[w.grade] ? s : w), null);
    const unsure = sounds.some((s) => s.grade === "green" && PARTNER[s.cmu] && s.closest === PARTNER[s.cmu] && s.score < UNSURE_MARGIN);
    const grade = worst && unsure && worst.grade === "green" ? "yellow" : worst?.grade ?? null;
    const at = worst ? result.sounds.indexOf(worst) : -1;
    return {
      letters: p.letters, sounds: p.sounds, grade, heard: worst?.heard ?? null, unsure,
      focusPhone: at >= 0 ? said.phones[at] : null,
      position: at < 0 ? null : at === 0 ? "start" : at === said.phones.length - 1 ? "end" : "middle",
    };
  });
  return { ...result, word: said.word, phones: said.phones, strong: said.strong, parts };
}
