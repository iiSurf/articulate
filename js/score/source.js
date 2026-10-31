// Where the scoring model comes from, and getting its bytes.
//
// The model is 355 MB, too big for GitHub, so it comes from Hugging Face, pinned to one version so it can't change
// under us. Its license is Apache 2.0: https://huggingface.co/robg/speako-phoneme-recognizer. It is checked by size
// here, and by checksum in tools/get-model.mjs.

export const MODEL = {
  repo: "robg/speako-phoneme-recognizer",
  revision: "ad0f63cd58fc1bb1e9c261a3b4135997a31c2e58",
  file: "onnx/model_quantized.onnx",
  bytes: 355216594,
  sha256: "1e03fc69aa5be1f365a94ffa17c060feafdadb626b8a662b7ba6b36cb9f0577e",
};

export const remoteUrl = (file = MODEL.file) => `https://huggingface.co/${MODEL.repo}/resolve/${MODEL.revision}/${file}`;

// The model's vocab.json from the same place (Apache 2.0), kept here so the app doesn't have to fetch it.
export const VOCAB = {
  " ": 16, "[PAD]": 41, "[UNK]": 40, "aɪ": 5, "aʊ": 4, b: 6, d: 8, "eɪ": 13, f: 14, g: 15, h: 17, i: 19, j: 38, k: 21,
  l: 22, m: 23, n: 24, "oʊ": 26, p: 28, s: 30, t: 32, u: 35, v: 36, w: 37, z: 39, "|": 0, "æ": 2, "ð": 9, "ŋ": 25,
  "ɑ": 1, "ɔɪ": 27, "ə": 3, "ɛ": 11, "ɝ": 12, "ɪ": 18, "ɹ": 29, "ɾ": 10, "ʃ": 31, "ʊ": 34, "ʤ": 20, "ʧ": 7, "θ": 33,
};

// The browser's saved copy lives in Cache Storage under this name (every iisurf.github.io site shares storage,
// so it starts with "articulate.").
export const CACHE_NAME = "articulate.model";

// The copy `npm run get-model` makes, which the local server (npm start) serves while developing.
export const LOCAL_URL = new URL(`../../.models/speako/${MODEL.file}`, import.meta.url).href;

// The model's bytes, from the first place that has them:
//   1. the local copy, while developing (on GitHub Pages it isn't there, and that's fine);
//   2. the copy this browser saved last time;
//   3. Hugging Face, saved in the browser afterwards.
// fetch and caches are passed in so the tests can stand in for the browser. onProgress gets 0 to 1 while
// downloading.
export async function modelBytes({ fetch = globalThis.fetch, caches = globalThis.caches, onProgress = () => {} } = {}) {
  try {
    const local = await fetch(LOCAL_URL);
    if (local.ok) return { bytes: new Uint8Array(await local.arrayBuffer()), from: "local" };
  } catch {
    // No local server, or no copy on it: carry on.
  }
  const url = remoteUrl();
  const cache = caches ? await caches.open(CACHE_NAME) : null;
  const saved = cache ? await cache.match(url) : null;
  if (saved) {
    const bytes = new Uint8Array(await saved.arrayBuffer());
    if (bytes.length === MODEL.bytes) return { bytes, from: "saved" };
    await cache.delete(url);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't download the sound model (${res.status}).`);
  const bytes = await readAll(res, onProgress);
  if (bytes.length !== MODEL.bytes) throw new Error("The sound model didn't download completely. Try again on Wi-Fi.");
  if (cache) await cache.put(url, new Response(bytes, { headers: { "Content-Type": "application/octet-stream" } }));
  return { bytes, from: "download" };
}

async function readAll(res, onProgress) {
  const out = new Uint8Array(MODEL.bytes);
  const reader = res.body.getReader();
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (got + value.length > out.length) throw new Error("The sound model download was bigger than expected.");
    out.set(value, got);
    got += value.length;
    onProgress(got / out.length);
  }
  return out.subarray(0, got);
}
