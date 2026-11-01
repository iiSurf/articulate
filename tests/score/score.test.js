// From a recording to graded sounds, with a stand-in for the model (no download).
import { test } from "node:test";
import assert from "node:assert/strict";
import { heardAs, scoreSounds } from "../../js/score/score.js";
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
