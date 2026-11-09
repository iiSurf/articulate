// From a recording to graded sounds, with a stand-in for the model (no download).
import { test } from "node:test";
import assert from "node:assert/strict";
import { heardAs, scoreRecording, scoreSounds } from "../../js/score/score.js";
import { RATE } from "../../js/score/audio.js";

const VOCAB = { "[PAD]": 0, "|": 1, "θ": 2, "ɪ": 3, "ŋ": 4, k: 5, s: 6, "[UNK]": 7 };

// A model that hears the given sounds ("-" is a gap), whatever it's given, and remembers how much audio it got.
function standIn(sounds) {
  const model = {
    vocab: VOCAB,
    got: 0,
    async run(samples) {
      model.got = samples.length;
      return sounds.map((s) => Object.keys(VOCAB).map((k) => (k === (s === "-" ? "[PAD]" : s) ? 8 : 0)));
    },
  };
  return model;
}

// Two seconds of quiet with half a second of "word" in the middle.
function recording() {
  const x = new Float32Array(2 * RATE).map((_, i) => ((i * 7919) % 13) / 13000 - 0.0005);
  for (let i = 0; i < RATE / 2; i++) x[0.75 * RATE + i] += 0.3 * Math.sin(i / 5);
  return x;
}
const THINK = ["TH", "IH1", "NG", "K"];

test("think said right: every sound green, and the model heard θ ɪ ŋ k", async () => {
  const result = await scoreSounds(recording(), THINK, standIn(["θ", "θ", "-", "ɪ", "ŋ", "-", "k"]));
  assert.deepEqual(result.sounds.map((s) => s.grade), ["green", "green", "green", "green"]);
  assert.deepEqual(result.sounds.map((s) => s.sound), ["θ", "ɪ", "ŋ", "k"]);
  assert.deepEqual(result.heard, ["θ", "ɪ", "ŋ", "k"]);
});

test("sink said for think: the th is red and sounded like s", async () => {
  const result = await scoreSounds(recording(), THINK, standIn(["s", "s", "-", "ɪ", "ŋ", "-", "k"]));
  assert.equal(result.sounds[0].grade, "red");
  assert.equal(result.sounds[0].heard, "s");
  assert.deepEqual(result.heard, ["s", "ɪ", "ŋ", "k"]);
});

test("the silence is cut before the model hears it", async () => {
  const model = standIn(["θ", "ɪ", "ŋ", "k"]);
  const result = await scoreSounds(recording(), THINK, model);
  assert.equal(result.seconds.recorded, 2);
  assert.ok(result.seconds.scored < 1.1, `scored ${result.seconds.scored} s`);
  assert.equal(model.got, Math.round(result.seconds.scored * RATE));
  assert.ok(result.ms.model >= 0 && result.ms.score >= 0);
});

test("what the model heard: repeats and gaps taken out", () => {
  const rows = ["θ", "θ", "-", "θ", "ɪ", "ɪ", "-", "-"].map((s) => Object.keys(VOCAB).map((k) => (k === (s === "-" ? "[PAD]" : s) ? 1 : 0)));
  assert.deepEqual(heardAs(rows, VOCAB), ["θ", "θ", "ɪ"]);
});

// A stand-in for lookUp: "weather" spelled w|ea|th|er.
const WORDS = {
  weather: { word: "weather", phones: ["W", "EH1", "DH", "ER0"], strong: 1,
    parts: [{ letters: "w", sounds: [0] }, { letters: "ea", sounds: [1] }, { letters: "th", sounds: [2] }, { letters: "er", sounds: [3] }] },
};
const fakeLookUp = async (w) => WORDS[w] || null;
const VOCAB2 = { "[PAD]": 0, "|": 1, w: 2, "ɛ": 3, "ð": 4, "ɝ": 5, d: 6, v: 7, "[UNK]": 8 };
const hears = (sounds) => async () => ({
  vocab: VOCAB2,
  run: async () => sounds.map((s) => Object.keys(VOCAB2).map((k) => (k === (s === "-" ? "[PAD]" : s) ? 8 : 0))),
});

test("a recording of a word: each part as it's spelled, with its color", async () => {
  const result = await scoreRecording(recording(), "weather", { lookUp: fakeLookUp, loadModel: hears(["w", "-", "ɛ", "-", "d", "-", "ɝ"]) });
  assert.equal(result.word, "weather");
  assert.equal(result.strong, 1);
  assert.deepEqual(result.parts.map((p) => [p.letters, p.grade, p.heard]), [
    ["w", "green", null],
    ["ea", "green", null], // the model heard the e clearly, with no a (its partner) anywhere close
    ["th", "red", "d"],
    ["er", "green", null],
  ]);
  assert.equal(result.parts[1].unsure, false);
  // which sound was worst in each part, as the dictionary writes it, and where it sits in the word
  assert.deepEqual(result.parts.map((p) => [p.focusPhone, p.position]), [["W", "start"], ["EH1", "middle"], ["DH", "middle"], ["ER0", "end"]]);
});

// A model that knows both e and a, for the vowels the model mixes up (bed and bad).
const VOCAB3 = { "[PAD]": 0, "|": 1, b: 2, "ɛ": 3, "æ": 4, d: 5, "ɾ": 6, "[UNK]": 7 };
const hearsBed = (frames) => async () => ({
  vocab: VOCAB3,
  run: async () => frames.map((f) => Object.keys(VOCAB3).map((k) => f[k] ?? (k === "[PAD]" && !Object.keys(f).length ? 8 : 0))),
});
const BED = { bed: { word: "bed", phones: ["B", "EH1", "D"], strong: 1, parts: [{ letters: "b", sounds: [0] }, { letters: "e", sounds: [1] }, { letters: "d", sounds: [2] }] } };
const bedLookUp = async (w) => BED[w] || null;

test("an e the model can't tell from an a shows yellow, unsure", async () => {
  // Frames where e only just beats a: the model isn't sure which was said.
  const loadModel = hearsBed([{ b: 8 }, {}, { "ɛ": 6, "æ": 5.6 }, { "ɛ": 6, "æ": 5.6 }, {}, { d: 8 }]);
  const result = await scoreRecording(recording(), "bed", { lookUp: bedLookUp, loadModel });
  assert.equal(result.parts[1].grade, "yellow");
  assert.equal(result.parts[1].unsure, true);
});

test("an e the model clearly heard stays green", async () => {
  const loadModel = hearsBed([{ b: 8 }, {}, { "ɛ": 8 }, { "ɛ": 8 }, {}, { d: 8 }]);
  const result = await scoreRecording(recording(), "bed", { lookUp: bedLookUp, loadModel });
  assert.equal(result.parts[1].grade, "green");
  assert.equal(result.parts[1].unsure, false);
});

test("a word with two ways to say it is scored by the way that was said", async () => {
  // "read": R IY1 D (reed) or R EH1 D (red). Said as "red".
  const VOCAB4 = { "[PAD]": 0, "|": 1, "ɹ": 2, i: 3, "ɛ": 4, d: 5, "ɾ": 6, "[UNK]": 7 };
  const parts = [{ letters: "r", sounds: [0] }, { letters: "ea", sounds: [1] }, { letters: "d", sounds: [2] }];
  const reed = { word: "read", phones: ["R", "IY1", "D"], strong: 1, parts };
  const red = { word: "read", phones: ["R", "EH1", "D"], strong: 1, parts };
  const lookUp = async () => ({ ...reed, ways: [reed, red] });
  const loadModel = async () => ({
    vocab: VOCAB4,
    run: async () => ["ɹ", "ɹ", "-", "ɛ", "ɛ", "-", "d"].map((s) => Object.keys(VOCAB4).map((k) => (k === (s === "-" ? "[PAD]" : s) ? 8 : 0))),
  });
  const result = await scoreRecording(recording(), "read", { lookUp, loadModel });
  assert.equal(result.way, 1);
  assert.deepEqual(result.phones, ["R", "EH1", "D"]);
  assert.ok(result.parts.every((p) => p.grade === "green" || p.grade === "yellow"), JSON.stringify(result.parts));
});

test("a word that isn't in the word list says so", async () => {
  await assert.rejects(scoreRecording(recording(), "zzqx", { lookUp: fakeLookUp, loadModel: hears([]) }), /isn't in our word list/);
});
