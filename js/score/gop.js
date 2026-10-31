// How close each sound of a word was, from a speech model's guesses (PLAN.md, "The scoring test").
//
// For every 20 ms of a recording, the model says how likely each sound is. For each sound of the word we ask:
// does the word as written fit the whole recording better than the same word with this one sound swapped for
// any other sound, or left out? The gap between the two, in natural-log units, is that sound's score. A big
// gap means clearly right. Below zero means another sound fit better, and that sound is what it sounded like.
// This is the alignment-free "goodness of pronunciation" for models trained with CTC (link in PLAN.md).

const NONE = -Infinity;

function addLog(a, b) {
  if (a === NONE) return b;
  if (b === NONE) return a;
  return a > b ? a + Math.log1p(Math.exp(b - a)) : b + Math.log1p(Math.exp(a - b));
}

// Raw model output (frames × vocabulary) to log-probabilities, frame by frame.
export function logSoftmax(frames) {
  return frames.map((row) => {
    let top = NONE;
    for (const x of row) if (x > top) top = x;
    let sum = 0;
    for (const x of row) sum += Math.exp(x - top);
    const norm = top + Math.log(sum);
    return Array.from(row, (x) => x - norm);
  });
}

// What the scoring needs from the model's vocabulary: which ids mean "no sound here" (the CTC blank, and the
// marks between words, which a single word doesn't need), and the sounds it can hear.
const NOT_SOUNDS = ["[PAD]", "[UNK]", "|", " "];
export function readVocab(vocab) {
  return {
    blank: ["[PAD]", "|", " "].filter((k) => k in vocab).map((k) => vocab[k]),
    sounds: Object.keys(vocab).filter((k) => !NOT_SOUNDS.includes(k)),
    id: vocab,
  };
}

// Everything about one recording that the fits below reuse: per frame, how likely "no sound" is, and a
// cache of how likely each group of sounds is.
export function prepare(logp, v) {
  const blank = logp.map((row) => v.blank.reduce((acc, id) => addLog(acc, row[id]), NONE));
  const cache = new Map();
  const emit = (sounds) => {
    const key = sounds.join(" ");
    if (!cache.has(key)) cache.set(key, logp.map((row) => sounds.reduce((acc, s) => addLog(acc, row[v.id[s]]), NONE)));
    return cache.get(key);
  };
  return { frames: logp.length, blank, emit };
}

// How well a sequence of labels fits the recording, over every possible timing (the CTC forward pass).
// Each label is a list of sounds that count as it.
export function fit(prep, labels) {
  const T = prep.frames, n = labels.length, S = 2 * n + 1;
  if (T === 0) return n === 0 ? 0 : NONE;
  const em = labels.map((l) => prep.emit(l));
  const keys = labels.map((l) => l.join(" "));
  let prev = new Float64Array(S).fill(NONE);
  prev[0] = prep.blank[0];
  if (n) prev[1] = em[0][0];
  for (let t = 1; t < T; t++) {
    const cur = new Float64Array(S).fill(NONE);
    for (let s = 0; s < S; s++) {
      let a = prev[s];
      if (s >= 1) a = addLog(a, prev[s - 1]);
      const label = s % 2 === 1;
      // A label may follow the label before it without a blank between, unless they are the same.
      if (label && s >= 3 && keys[(s - 1) / 2] !== keys[(s - 3) / 2]) a = addLog(a, prev[s - 2]);
      cur[s] = a + (label ? em[(s - 1) / 2][t] : prep.blank[t]);
    }
    prev = cur;
  }
  return n ? addLog(prev[S - 1], prev[S - 2]) : prev[0];
}

// Where the colors start: at or above green is green, and so on down; below orange is red. Picked by the scoring
// test on three of the Mac's voices and checked on three others (docs/scoring-test.md). A sound said right can
// score a little below zero and still be green, because the model is never fully sure. Check these again with
// real voices.
export const CUTS = { green: -1.8, yellow: -2.3, orange: -6.6 };

export function gradeOf(score, cuts = CUTS) {
  if (score >= cuts.green) return "green";
  if (score >= cuts.yellow) return "yellow";
  if (score >= cuts.orange) return "orange";
  return "red";
}

// Scores each sound of a word. word is a list of { cmu, ok } (from targets() in phones.js).
// Returns, for each sound: its score, its grade, and, when it isn't green, the closest other sound
// ("" means it sounded left out).
export function scoreWord(prep, word, v, cuts = CUTS) {
  const labels = word.map((w) => w.ok);
  const whole = fit(prep, labels);
  return word.map((w, i) => {
    let best = fit(prep, labels.filter((_, j) => j !== i)), heard = "";
    for (const s of v.sounds) {
      if (w.ok.includes(s)) continue;
      const other = fit(prep, labels.map((l, j) => (j === i ? [s] : l)));
      if (other > best) { best = other; heard = s; }
    }
    const score = whole - best;
    const grade = gradeOf(score, cuts);
    return { cmu: w.cmu, score, grade, heard: grade === "green" ? null : heard };
  });
}
