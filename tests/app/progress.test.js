// Remembering tries, scoring a word, and the three boards, the hardest sounds, and a round's words.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GOOD_ENOUGH, MAX_TRIES, MAX_WORDS, hardestSounds, mostImproved, needsWork, ownWordFor, recordTry, roundWords, scoreOf, stars, toneOf, topWords } from "../../js/progress.js";
import { fresh, sanitize } from "../../js/store.js";

const tips = JSON.parse(readFileSync(new URL("../../data/tips/uk-en.json", import.meta.url), "utf8"));
const part = (letters, grade, focusPhone = null) => ({ letters, grade, focusPhone });
const result = (word, ...parts) => ({ word, parts });
// A state where each word has had the given scores, oldest first, all with no trouble spots.
function stateWith(words) {
  const s = fresh();
  for (const [word, scores] of Object.entries(words)) s.history[word] = scores.map((score, i) => ({ at: `2026-11-08T10:${String(i).padStart(2, "0")}:00.000Z`, score, bad: score < 80 ? [["TH", "red", "th"]] : [] }));
  return s;
}

test("a word's score: green counts fully, yellow 70%, orange 40%, red nothing, silent letters skipped", () => {
  assert.equal(scoreOf([part("th", "green"), part("i", "green"), part("nk", "green")]), 100);
  assert.equal(scoreOf([part("th", "red"), part("i", "green"), part("n", "green"), part("k", "green")]), 75);
  assert.equal(scoreOf([part("w", "orange"), part("ea", "yellow"), part("th", "red"), part("er", "green")]), 53);
  assert.equal(scoreOf([part("w", "green"), part("e", null)]), 100, "a silent letter isn't counted");
  assert.equal(scoreOf([part("e", null)]), null);
  assert.equal(scoreOf([]), null);
});

test("remembering a try keeps its score and the parts that went orange or red, by sound", () => {
  const s = fresh();
  const t = recordTry(s, result("think", part("th", "red", "TH"), part("i", "green", "IH1"), part("n", "orange", "N"), part("k", "yellow", "K")), new Date("2026-11-08T10:00:00Z"));
  assert.equal(t.score, Math.round((0 + 1 + 0.4 + 0.7) / 4 * 100));
  assert.deepEqual(s.history.think[0].bad, [["TH", "red", "th"], ["N", "orange", "n"]]);
  assert.equal(s.history.think[0].at, "2026-11-08T10:00:00.000Z");
  assert.equal(recordTry(s, result("", part("a", "green"))), null);
  assert.equal(recordTry(s, result("x", part("e", null))), null);
  recordTry(s, result("about", part("a", "red", "AH0"), part("b", "green", "B")));
  assert.deepEqual(s.history.about[0].bad, [["AH0", "red", "a"]], "the small uh is kept apart from the uh of cut");
});

test("only the last 30 tries of a word are kept, and the word tried longest ago goes when there are too many", () => {
  const s = fresh();
  for (let i = 0; i < MAX_TRIES + 5; i++) recordTry(s, result("think", part("th", "green", "TH")), new Date(2026, 10, 1, 10, i));
  assert.equal(s.history.think.length, MAX_TRIES);
  assert.equal(s.history.think[0].at, new Date(2026, 10, 1, 10, 5).toISOString(), "the oldest tries went first");
  const t = fresh();
  for (let i = 0; i < MAX_WORDS + 3; i++) recordTry(t, result(`w${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26))}`, part("w", "green", "W")), new Date(2026, 10, 1, 10, i));
  assert.equal(Object.keys(t.history).length, MAX_WORDS);
  assert.ok(!("waa" in t.history), "the first word tried was dropped");
});

test("Top words: the best of the last three tries, highest first", () => {
  const s = stateWith({ three: [60, 96, 90], world: [92], very: [50, 88, 40, 30], thirty: [84, 84] });
  assert.deepEqual(topWords(s).map((w) => [w.word, w.best]), [["three", 96], ["world", 92], ["very", 88], ["thirty", 84]], "very's 88 is within its last three tries; its first 50 is not counted");
  assert.equal(topWords(s, 2).length, 2);
  assert.deepEqual(topWords(stateWith({ think: [22], vegetable: [55, 59], world: [60] })).map((w) => w.word), ["world"], "only words at 60 or more");
  assert.deepEqual(topWords(fresh()), []);
});

test("Needs work: the average of the last three tries, lowest first, and words said well don't appear", () => {
  const s = stateWith({ think: [22], vegetable: [31, 31], world: [92], this: [38, 60, 20], weather: [79] });
  assert.deepEqual(needsWork(s).map((w) => [w.word, w.recent]), [["think", 22], ["vegetable", 31], ["this", 39], ["weather", 79]]);
  assert.ok(!needsWork(s).some((w) => w.word === "world"));
  assert.ok(GOOD_ENOUGH === 80);
});

test("Needs work says which part went worst on the last try, a red one before an orange one", () => {
  const s = fresh();
  recordTry(s, result("weather", part("w", "orange", "W"), part("ea", "good", "EH1"), part("th", "red", "DH"), part("er", "green", "ER0")));
  const w = needsWork(s)[0];
  assert.deepEqual(w.spot, { sound: "DH", grade: "red", letters: "th" });
});

test("Most improved: the last tries against the first ones, biggest jump first, with two tries and a gain of 10", () => {
  const s = stateWith({ world: [54, 92], very: [57, 60, 88], thirty: [57, 84], weather: [60, 62], think: [22], steady: [80, 85] });
  const m = mostImproved(s);
  assert.deepEqual(m.map((w) => [w.word, w.first, w.latest, w.gain]), [["world", 54, 92, 38], ["thirty", 57, 84, 27], ["very", 57, 88, 31]].sort((a, b) => b[3] - a[3]));
  assert.ok(!m.some((w) => ["weather", "think", "steady"].includes(w.word)), "too small a gain, one try, or already good with a tiny gain");
});

test("the first and the last tries never overlap, so one try is never its own improvement", () => {
  assert.deepEqual(mostImproved(stateWith({ a: [20] })), []);
  const s = stateWith({ a: [20, 40, 60, 80, 90, 95] });
  assert.deepEqual([s.history.a.length, mostImproved(s)[0].first, mostImproved(s)[0].latest], [6, 40, 88]);
});

test("the hardest sounds: counted across every kept try, most first, with the words that had them", () => {
  const s = fresh();
  for (let i = 0; i < 3; i++) recordTry(s, result("think", part("th", "red", "TH"), part("i", "green", "IH1")));
  for (let i = 0; i < 2; i++) recordTry(s, result("this", part("th", "red", "DH"), part("i", "green", "IH1")));
  recordTry(s, result("three", part("th", "orange", "TH"), part("r", "green", "R")));
  recordTry(s, result("very", part("v", "yellow", "V"), part("e", "green", "EH1")));
  assert.deepEqual(hardestSounds(s).map((h) => [h.sound, h.misses]), [["TH", 4], ["DH", 2]]);
  assert.deepEqual(hardestSounds(s)[0].words, ["think", "three"]);
  assert.deepEqual(hardestSounds(fresh()), []);
});

test("a round's five words: their own trouble word first, then words with that sound from the tips", () => {
  const s = fresh();
  recordTry(s, result("thirsty", part("th", "red", "TH"), part("ir", "green", "ER1")));
  const w = roundWords(tips, s, "TH");
  assert.equal(w.length, 5);
  assert.equal(w[0], "thirsty");
  assert.deepEqual(w.slice(1), ["thank", "thin", "three", "thing"]);
  assert.deepEqual(roundWords(tips, fresh(), "TH"), ["thank", "thin", "three", "thing", "think"]);
  assert.deepEqual(roundWords(tips, s, "XX"), []);
  assert.deepEqual(roundWords(tips, stateWith({ thank: [10] }), "TH").filter((x) => x === "thank").length, 1, "no word twice");
});

test("a star for each word said well enough in a round", () => {
  assert.equal(stars([{ word: "a", score: 100 }, { word: "b", score: 80 }, { word: "c", score: 79 }, { word: "d", score: 0 }]), 2);
  assert.equal(stars([]), 0);
});

test("the history saved on the phone is checked on the way back in: bad shapes are dropped, good ones kept", () => {
  const good = { at: "2026-11-08T10:00:00.000Z", score: 75, bad: [["TH", "red", "th"]] };
  const s = sanitize({ history: { think: [good, { at: 5, score: 1, bad: [] }, { at: "x", score: 101, bad: [] }, { at: "x", score: 50, bad: "no" }], "<b>x</b>": [good], empty: [], this: "nope" } });
  assert.deepEqual(Object.keys(s.history), ["think"]);
  assert.deepEqual(s.history.think, [good]);
  assert.deepEqual(sanitize({ history: [good] }).history, {});
  assert.deepEqual(sanitize({ history: null }).history, {});
  assert.deepEqual(fresh().history, {});
  const odd = sanitize({ history: { a: [{ at: "x", score: 50, bad: [["TH", "green", "th"], ["DH", "red", "th"], 5] }] } });
  assert.deepEqual(odd.history.a[0].bad, [["DH", "red", "th"]]);
});

test("a score's color: good from 80, close from 60, a little off from 40, then needs work", () => {
  assert.deepEqual([100, 80, 79, 60, 59, 40, 39, 0].map(toneOf), ["good", "good", "close", "close", "off", "off", "work", "work"]);
});

test("their own trouble word for a sound is the one that went wrong with it most", () => {
  const s = fresh();
  recordTry(s, result("this", part("th", "red", "DH")));
  recordTry(s, result("that", part("th", "red", "DH")));
  recordTry(s, result("that", part("th", "red", "DH")));
  assert.equal(ownWordFor(s, "DH"), "that");
  assert.equal(ownWordFor(s, "TH"), undefined);
});

test("the last round of each sound is kept as a number of stars from 0 to 5, and bad shapes are dropped", () => {
  const s = sanitize({ rounds: { TH: { at: "2026-11-08T10:00:00.000Z", stars: 3 }, AH0: { at: "x", stars: 0 }, W: { at: "x", stars: 6 }, V: { at: "x", stars: 2.5 }, "<b>": { at: "x", stars: 1 }, R: { stars: 1 }, T: null } });
  assert.deepEqual(Object.keys(s.rounds).sort(), ["AH0", "TH"]);
  assert.deepEqual(s.rounds.TH, { at: "2026-11-08T10:00:00.000Z", stars: 3 });
  assert.deepEqual(sanitize({ rounds: [1] }).rounds, {});
  assert.deepEqual(fresh().rounds, {});
});
