// Reading WAV files and scaling audio for the model.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readWav, normalize, trimSilence, resample, RATE } from "../../js/score/audio.js";

function wav(samples, { rate = RATE, channels = 1, bits = 16 } = {}) {
  const data = samples.length * 2, buf = new ArrayBuffer(44 + data), v = new DataView(buf);
  const put = (at, s) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  put(0, "RIFF"); v.setUint32(4, 36 + data, true); put(8, "WAVE");
  put(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, channels, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, bits, true);
  put(36, "data"); v.setUint32(40, data, true);
  samples.forEach((s, i) => v.setInt16(44 + i * 2, s, true));
  return buf;
}

test("reads 16-bit, one channel, 16 kHz audio", () => {
  const out = readWav(wav([0, 16384, -32768]));
  assert.deepEqual(Array.from(out), [0, 0.5, -1]);
});

test("refuses other audio", () => {
  assert.throws(() => readWav(wav([0], { rate: 44100 })), /16000/);
  assert.throws(() => readWav(new TextEncoder().encode("hello, not audio at all, really").buffer), /Not a WAV/);
});

test("scaling: average 0, spread 1", () => {
  const x = normalize(Float32Array.from([1, 2, 3, 4]));
  const mean = x.reduce((a, b) => a + b, 0) / x.length;
  const spread = x.reduce((a, b) => a + (b - mean) ** 2, 0) / x.length;
  assert.ok(Math.abs(mean) < 1e-6);
  assert.ok(Math.abs(spread - 1) < 1e-4);
});

// Quiet room noise with a loud "word" in the middle, at 16 kHz.
function wordInQuiet({ before = 1, word = 0.5, after = 1, quietLevel = 0.001, loud = 0.3 } = {}) {
  const n = (s) => Math.round(s * RATE);
  let seed = 7;
  const noise = () => (((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5) * 2 * quietLevel;
  const out = new Float32Array(n(before) + n(word) + n(after));
  for (let i = 0; i < out.length; i++) out[i] = noise();
  for (let i = 0; i < n(word); i++) out[n(before) + i] += loud * Math.sin((2 * Math.PI * 220 * i) / RATE);
  return out;
}

test("trimming keeps the word and a quarter second each side", () => {
  const x = wordInQuiet();
  const kept = trimSilence(x);
  const seconds = kept.length / RATE;
  assert.ok(seconds > 0.95 && seconds < 1.1, `kept ${seconds.toFixed(2)} s of 2.5 s`);
});

test("trimming keeps a quiet sound right before the loud part", () => {
  // A soft "th" (much quieter than the vowel) for 0.15 s just before the word.
  const x = wordInQuiet();
  for (let i = 0; i < 0.15 * RATE; i++) x[RATE - 0.15 * RATE + i] += 0.004 * Math.sin(i);
  const kept = trimSilence(x);
  const start = kept.byteOffset / Float32Array.BYTES_PER_ELEMENT; // where the kept part begins
  assert.ok(start <= 0.85 * RATE, `starts at ${(start / RATE).toFixed(2)} s, after the soft sound at 0.85 s`);
});

test("trimming leaves a recording alone when there's no word in it", () => {
  const quiet = wordInQuiet({ loud: 0 });
  assert.equal(trimSilence(quiet).length, quiet.length);
  assert.equal(trimSilence(new Float32Array(0)).length, 0);
});

test("changing the rate from 48 kHz to 16 kHz", () => {
  const x = Float32Array.from({ length: 4800 }, (_, i) => (i % 3 === 0 ? 1 : 0));
  const y = resample(x, 48000, 16000);
  assert.equal(y.length, 1600);
  assert.ok(Math.abs(y[10] - 1 / 3) < 1e-6);
});
