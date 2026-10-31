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
