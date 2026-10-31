// Reading WAV files and scaling audio for the model.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readWav, normalize, RATE } from "../../js/score/audio.js";

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
