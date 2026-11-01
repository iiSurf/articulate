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
    ["ea", "yellow", null], // a vowel the model hears poorly never shows better than yellow
    ["th", "red", "d"],
    ["er", "green", null],
  ]);
  assert.equal(result.parts[1].unsure, true);
});

test("a word that isn't in the word list says so", async () => {
  await assert.rejects(scoreRecording(recording(), "zzqx", { lookUp: fakeLookUp, loadModel: hears([]) }), /isn't in our word list/);
});
