// Audio for the scoring model: 16,000 samples a second, one channel, scaled the way the model was trained.

export const RATE = 16000;

// Reads a WAV file (16-bit, one channel, 16 kHz) into samples between -1 and 1. Used by the tools and tests.
export function readWav(buffer) {
  const view = new DataView(buffer instanceof ArrayBuffer ? buffer : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  const text = (at, n) => String.fromCharCode(...Array.from({ length: n }, (_, i) => view.getUint8(at + i)));
  if (text(0, 4) !== "RIFF" || text(8, 4) !== "WAVE") throw new Error("Not a WAV file");
  let at = 12, format = null;
  while (at + 8 <= view.byteLength) {
    const id = text(at, 4), size = view.getUint32(at + 4, true), body = at + 8;
    if (id === "fmt ") {
      format = { channels: view.getUint16(body + 2, true), rate: view.getUint32(body + 4, true), bits: view.getUint16(body + 14, true) };
    } else if (id === "data") {
      if (!format || format.channels !== 1 || format.rate !== RATE || format.bits !== 16) {
        throw new Error(`Needs 16-bit, one channel, ${RATE} Hz audio`);
      }
      const samples = new Float32Array(Math.floor(size / 2));
      for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(body + i * 2, true) / 32768;
      return samples;
    }
    at = body + size + (size % 2);
  }
  throw new Error("No audio in the WAV file");
}

// The model expects each recording scaled to an average of 0 and a spread of 1 (wav2vec2's "do_normalize").
export function normalize(samples) {
  let mean = 0;
  for (const x of samples) mean += x;
  mean /= samples.length || 1;
  let spread = 0;
  for (const x of samples) spread += (x - mean) ** 2;
  const scale = 1 / Math.sqrt(spread / (samples.length || 1) + 1e-7);
  return Float32Array.from(samples, (x) => (x - mean) * scale);
}

// Cuts the silence before and after a word, keeping a margin on each side, because the model's time grows with
// the length of the recording (docs/scoring-test.md). A 20 ms frame counts as sound when it is louder than a
// twentieth of the loudest frame and well above the room's quiet. The margin is wide on purpose: a "th" or "f" at
// the start or end of a word is much quieter than its vowel, and cutting it off would make it look left out.
// Returns the samples as they are when it can't tell the word from the quiet.
export function trimSilence(samples, { rate = RATE, margin = 0.25, frame = 0.02 } = {}) {
  const size = Math.max(1, Math.round(frame * rate));
  const loudness = [];
  for (let at = 0; at < samples.length; at += size) {
    const end = Math.min(samples.length, at + size);
    let sum = 0;
    for (let i = at; i < end; i++) sum += samples[i] * samples[i];
    loudness.push(Math.sqrt(sum / (end - at)));
  }
  if (loudness.length < 3) return samples;
  const sorted = [...loudness].sort((a, b) => a - b);
  const loudest = sorted[sorted.length - 1], quiet = sorted[Math.floor(sorted.length * 0.1)];
  if (!(loudest > 0) || loudest < quiet * 4) return samples;
  const line = Math.max(loudest / 20, quiet * 4);
  let first = loudness.findIndex((x) => x >= line), last = loudness.length - 1;
  while (last > first && loudness[last] < line) last--;
  const keep = Math.round(margin * rate);
  return samples.subarray(Math.max(0, first * size - keep), Math.min(samples.length, (last + 1) * size + keep));
}

// Turns a recording (a Blob from MediaRecorder) into 16 kHz samples for the model, in the browser. The browser
// decodes it and changes the rate itself; if it can't decode straight to 16 kHz, the rate is changed here.
export async function decodeRecording(blob) {
  const data = await blob.arrayBuffer();
  let buffer;
  try {
    buffer = await new OfflineAudioContext(1, 1, RATE).decodeAudioData(data.slice(0));
  } catch {
    buffer = await new OfflineAudioContext(1, 1, 48000).decodeAudioData(data);
  }
  const mono = new Float32Array(buffer.length);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const ch = buffer.getChannelData(c);
    for (let i = 0; i < mono.length; i++) mono[i] += ch[i] / buffer.numberOfChannels;
  }
  return buffer.sampleRate === RATE ? mono : resample(mono, buffer.sampleRate, RATE);
}

// Changes the sample rate by averaging each stretch of samples into one (good enough for going down to 16 kHz).
export function resample(samples, from, to) {
  const ratio = from / to, out = new Float32Array(Math.floor(samples.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const a = Math.floor(i * ratio), b = Math.max(a + 1, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = a; j < b && j < samples.length; j++) sum += samples[j];
    out[i] = sum / (b - a);
  }
  return out;
}
