// The scoring math, checked with made-up model output (no model, no audio).
import { test } from "node:test";
import assert from "node:assert/strict";
import { logSoftmax, readVocab, prepare, fit, scoreWord, gradeOf, CUTS } from "../../js/score/gop.js";
import { targets } from "../../js/score/phones.js";

// A tiny model that hears three sounds.
const VOCAB = { "[PAD]": 0, "|": 1, a: 2, b: 3, c: 4, "[UNK]": 5 };
const v = readVocab(VOCAB);

// Frames from a list like ["a", "a", "-", "b"]: the named sound (or "-" for no sound) is far more likely.
function frames(list, strong = 8) {
  return logSoftmax(list.map((x) => Object.keys(VOCAB).map((k) => (k === (x === "-" ? "[PAD]" : x) ? strong : 0))));
}
const word = (...sounds) => sounds.map((s) => ({ cmu: s, ok: [s] }));

test("reading the vocabulary: blanks and sounds", () => {
  assert.deepEqual(v.blank, [0, 1]);
  assert.deepEqual(v.sounds, ["a", "b", "c"]);
});

test("fit adds up every timing, the same as listing them all", () => {
  // Three frames, one label "a": every path over {blank, a} that collapses to "a".
  const logp = logSoftmax([[1, 0, 2, 0.5, 0, 0], [0.3, 0, 1, 2, 0, 0], [2, 0, 0.1, 0, 1, 0]]);
  const p = (t, k) => Math.exp(logp[t][k]);
  const B = (t) => p(t, 0) + p(t, 1); // blank and the word mark both count as no sound
  const A = (t) => p(t, 2);
  // ("a-a" is not one of them: it collapses to "aa".)
  let brute = 0;
  for (const path of ["a--", "-a-", "--a", "aa-", "-aa", "aaa"]) {
    brute += [...path].reduce((acc, ch, t) => acc * (ch === "a" ? A(t) : B(t)), 1);
  }
  assert.ok(Math.abs(Math.exp(fit(prepare(logp, v), [["a"]])) - brute) < 1e-12);
});

test("a word said as written: every sound is green", () => {
  const prep = prepare(frames(["a", "a", "-", "b", "b", "-", "c", "c"]), v);
  const result = scoreWord(prep, word("a", "b", "c"), v, { green: 3, yellow: 1, orange: -1 });
  assert.deepEqual(result.map((r) => r.grade), ["green", "green", "green"]);
  assert.ok(result.every((r) => r.heard === null));
});

test("one sound swapped: that sound is red, and it says what it sounded like", () => {
  const prep = prepare(frames(["a", "a", "-", "c", "c", "-", "c", "c"]), v);
  const [first, middle, last] = scoreWord(prep, word("a", "b", "c"), v);
  assert.equal(middle.grade, "red");
  assert.equal(middle.heard, "c");
  assert.equal(first.grade, "green");
  assert.equal(last.grade, "green");
});

test("one sound left out: that sound is red, and it sounded left out", () => {
  const prep = prepare(frames(["a", "a", "-", "c", "c"]), v);
  const [, middle] = scoreWord(prep, word("a", "b", "c"), v);
  assert.equal(middle.grade, "red");
  assert.equal(middle.heard, "");
});

test("a sound that is in between scores between", () => {
  // The middle frames are split between b and c, so b is neither clearly right nor clearly wrong.
  const mixed = logSoftmax([[0, 0, 8, 0, 0, 0], [8, 0, 0, 0, 0, 0], [0, 0, 0, 6, 6, 0], [8, 0, 0, 0, 0, 0], [0, 0, 0, 0, 8, 0]]);
  const [, middle] = scoreWord(prepare(mixed, v), word("a", "b", "c"), v);
  assert.ok(Math.abs(middle.score) < 3, `score ${middle.score}`);
});

test("a sound that also counts as right is not marked wrong", () => {
  const prep = prepare(frames(["a", "-", "c", "-", "b"]), v);
  const result = scoreWord(prep, [{ cmu: "A", ok: ["a"] }, { cmu: "T", ok: ["b", "c"] }, { cmu: "B", ok: ["b"] }], v);
  assert.equal(result[1].grade, "green");
});

test("grades from scores", () => {
  const cuts = { green: 3, yellow: 1, orange: -1 };
  assert.equal(gradeOf(5, cuts), "green");
  assert.equal(gradeOf(3, cuts), "green");
  assert.equal(gradeOf(2, cuts), "yellow");
  assert.equal(gradeOf(0, cuts), "orange");
  assert.equal(gradeOf(-4, cuts), "red");
});

test("the cuts from the scoring test go from green down to red", () => {
  assert.ok(CUTS.green >= CUTS.yellow && CUTS.yellow >= CUTS.orange);
  assert.equal(gradeOf(0), "green");
  assert.equal(gradeOf(-12), "red");
});

test("dictionary sounds to model sounds", () => {
  assert.deepEqual(targets(["TH", "IH1", "NG", "K"]).map((t) => t.ok), [["θ"], ["ɪ"], ["ŋ"], ["k"]]);
  assert.deepEqual(targets(["K", "AO1", "T"]).map((t) => t.ok), [["k"], ["ɑ"], ["t", "ɾ"]]);
  assert.throws(() => targets(["QQ"]), /Unknown sound/);
});
