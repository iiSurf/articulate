// Where the scoring model comes from, and getting its bytes.
//
// The model is 355 MB, too big for GitHub, so it comes from Hugging Face, pinned to one version so it can't change
// under us. Its license is Apache 2.0: https://huggingface.co/robg/speako-phoneme-recognizer.
//
// It comes in 8 MB pieces, each asked for with a range request and checked against its own checksum (pieceSha256)
// before it is kept. A piece that is kept stays kept: if the connection breaks, or the page closes, the next try asks
// only for the pieces that are missing. A piece that fails is tried again by itself, a few times.

export const MODEL = {
  repo: "robg/speako-phoneme-recognizer",
  revision: "ad0f63cd58fc1bb1e9c261a3b4135997a31c2e58",
  file: "onnx/model_quantized.onnx",
  bytes: 355216594,
  sha256: "1e03fc69aa5be1f365a94ffa17c060feafdadb626b8a662b7ba6b36cb9f0577e",
  pieceBytes: 8 * 1024 * 1024,
  // The sha256 of each piece, in order. (tools/get-model.mjs checks the whole file; a test checks these against it.)
  pieceSha256: [
    "8230c3527cb5e2929d7952f8ef62b891a92ef2f0cedb120a63924b7f26729433",
    "06c6a76f059188b31dceebf6febb6bb9f5b191cf2b5dfd435f11f0f9acf0d63a",
    "2f8b8380e0e2b9607fc398330625c1524a95efdeee4f90fffd6a3ccb64408fbc",
    "75da7e2b835cf5c04c21fb1016fae57272c6479c84876f11def2370ee09f3510",
    "fe8b309c1c614c26c60a2141f6f67d44106d68979f533a7f89b57ee6dbe8ce54",
    "23f3e1a242cfdd2a3286f5927695f61370dbacb5cea0d62f2e1b0c585237f4ec",
    "f847d8ed98c632873fbbff6d30a0240b7d6c352e5bc6eba8e7cf3aff281a6ae3",
    "8e1836a0a4bf1432befae4e81394fa5c6cd0dd129440cfdf7345944bb6b2c20a",
    "e77821e8f83b6ea8664f10babbfcc65d90d47c94630472e1d1dce87568a70bf8",
    "6ffd35d5a1abd47df44fac89d5acc797938866e67cd4f1e7c8c2de21e2006943",
    "8bcda6d6ba476f30263c02484303338deb59a0ac5c59f72119ed934c5013814c",
    "c648c3c5263735f30a3a407e663fc0fd0307191b5d3a3a9fe6283ae18e19a5d7",
    "0591a2fc2b22ae7c8dbaeaf7f51af4569a9d956288bde5678fc567f94b5d374a",
    "6d5e7049be4331555265452c29515472eb3414d09bddeff7d879bf19c520d3d2",
    "a9c83c7d2e7f2848d7ce3c20447a1095603ad497fc62bb521ff532d5ba34277a",
    "16632f9ea20d6bf6576eca1ba04c62ed1ec124913b13c2f5a5eb36e946eccf13",
    "01c8153019547878509c0d465620dec41cf67de71973c4353be4dcff2f90578e",
    "9d5c17f39d9526afa9a858d8428a54201f43654200e16ed02410614f867be5eb",
    "2b7f54c97720760b7f4c5bffdfb7fbf0e9657b7cb72c32ada59ee4ffb42d1902",
    "80f919dead48f675134f3332ca97cbbc0c112d7ab3f54452a653926b8d5ff47c",
    "e310ff6d74bc5ef04768bc5aae09ebf81bc0915475b2805544c049eb9718097b",
    "84d4fad6dc86366b1001b23812e069730200fe2d7e5c9a6aebd9b4b9544bf545",
    "601a9676caa437cec30027c39956c27e47ead22c4dff47a0cbc632f2b3d47d7f",
    "0b960f5d001f38e482f2c71368a9ca85e73ef13dcd1f66c8b670ed68e2ae6037",
    "2a4476e34b702844046520140397c8aefd2eaafbd48345db99bc054da266c73c",
    "3a232b36dfee6824eb962f232c376fa9d5e53e36606ff80c5f4e3d7389b8384f",
    "0656ee9c0e28deb9a87822ba3f851583044cf135bbe62e544400629d80dae750",
    "0b9be1b5462cd7b8c846786d6d460b8fea6010172317f73ec59ff0e06132b3cf",
    "8c8b3bafe51d648a2f3288c909f818750150e127508956ef2c9ae160fc9c2878",
    "71c086ff0c5e5155db541f318bbe68b396466f1b5cbb7984e0270b48ca18b236",
    "55fb254b12e856156b1e08210c5bde3845f15effc7be21c6e51cc60afffca01c",
    "aded587355b7e03941d96ddbd2e83c225309d78e56137b3860c0a85c27418b54",
    "f2b1b0898b7103bfe3baf3c38beee036f521afe6beecddd53f00ec95de583e42",
    "f7f4aecc2dab803b6ab64e61cce65e245db917c7ff8a2e0e36ee0c56ca915497",
    "ed58df3ac2e673b9a62d0580715336135831474a2232bbc3bb78d342cb57b8f4",
    "cc839c5aefbb81eb6a4a3c073c07518506a14b0eca62bd934abd59d54dda3704",
    "bbe9296b83e412cda41e6becf8df90367fff5a748176c91a2a14dbdd45d33652",
    "ab70c5e25bac186e1f76680c0550d66702bb80c26506d5e7939cbacdee9503f6",
    "c032bab8ca499bfa619df5679b5e6c60a770dd1776527d513dfdbe1e6bcd33eb",
    "c943baf38721afd63362339a9f00cef66869bc29c6b4c2be10d23b6cce05926a",
    "0c5ecbd05bcdb1dd6ebf7d979b65a56fe613231aabf37a27ebd48bf4a3cebfb5",
    "b93f4d8afacf7af69c598b999ca5d90724eefdb9cd47b4bb73407cafa6128568",
    "b6a508879defe0ac8920355b321818c7175270b763b5f05dd7a6b3072955e659",
  ],
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

// Where the pieces wait while a download is going on, apart from the finished copy (which is CACHE_NAME).
export const PARTS_CACHE = "articulate.model.parts";
const partKey = (model, n) => `https://articulate.invalid/${model.revision}/part-${n}`;
const pieceCount = (model) => Math.ceil(model.bytes / model.pieceBytes);
const pieceSize = (model, n) => Math.min(model.pieceBytes, model.bytes - n * model.pieceBytes);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// How long to wait before each new try of a piece: three more tries after the first.
const WAITS = [1500, 4000, 9000];

async function sha256(bytes) {
  const subtle = globalThis.crypto?.subtle; // only on a secure page (https or localhost)
  if (!subtle) return null;
  return [...new Uint8Array(await subtle.digest("SHA-256", bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Asks the browser to keep what's been saved, so it isn't quietly deleted when the phone runs low on space.
// Returns true or false, or null if this browser can't say.
export async function keepStorage(storage = globalThis.navigator?.storage) {
  try {
    if (!storage?.persist) return null;
    return (await storage.persisted?.()) || (await storage.persist());
  } catch {
    return null;
  }
}

// How much of a download is already kept from an earlier try: { done, total } in bytes, or null if none.
export async function partialDownload({ caches = globalThis.caches, model = MODEL } = {}) {
  if (!caches) return null;
  try {
    if (!(await caches.has(PARTS_CACHE))) return null;
    const keys = await (await caches.open(PARTS_CACHE)).keys();
    const mine = new Set(keys.map((r) => r.url));
    let done = 0;
    for (let n = 0; n < pieceCount(model); n++) if (mine.has(partKey(model, n))) done += pieceSize(model, n);
    return done > 0 && done < model.bytes ? { done, total: model.bytes } : null;
  } catch {
    return null;
  }
}

// The model's bytes, from the first place that has them:
//   1. the local copy, while developing (on GitHub Pages it isn't there, and that's fine);
//   2. the copy this browser saved last time;
//   3. Hugging Face, in checked pieces that are kept as they arrive, then saved whole in the browser.
// fetch and caches are passed in so the tests can stand in for the browser. onProgress gets 0 to 1 while
// downloading (it starts where an earlier try stopped). model, wait, and digest are for the tests too.
export async function modelBytes({ fetch = globalThis.fetch, caches = globalThis.caches, onProgress = () => {}, model = MODEL, wait = sleep, digest = sha256, storage } = {}) {
  try {
    const local = await fetch(LOCAL_URL);
    if (local.ok) return { bytes: new Uint8Array(await local.arrayBuffer()), from: "local" };
  } catch {
    // No local server, or no copy on it: carry on.
  }
  const url = remoteUrl();
  const cache = await openCache(caches, CACHE_NAME);
  const saved = cache ? await cache.match(url) : null;
  if (saved) {
    const bytes = new Uint8Array(await saved.arrayBuffer());
    if (bytes.length === model.bytes) return { bytes, from: "saved" };
    await cache.delete(url);
  }
  keepStorage(storage);
  const bytes = await downloadPieces({ fetch, caches, onProgress, model, wait, digest });
  memoryPieces.clear();
  if (cache) {
    await cache.put(url, new Response(bytes, { headers: { "Content-Type": "application/octet-stream" } }));
    await caches.delete(PARTS_CACHE);
    keepStorage(storage);
  }
  return { bytes, from: "download" };
}

// Opens a Cache Storage cache, or says null if this browser won't (some private windows refuse).
async function openCache(caches, name) {
  try {
    return caches ? await caches.open(name) : null;
  } catch {
    return null;
  }
}

// Where kept pieces go when the browser has no Cache Storage: in memory, so a retry in the same visit still resumes.
class MemoryPieces {
  constructor() { this.map = new Map(); }
  async match(key) { return this.map.has(key) ? new Response(this.map.get(key)) : undefined; }
  async put(key, res) { this.map.set(key, new Uint8Array(await res.arrayBuffer())); }
  async delete(key) { return this.map.delete(key); }
  clear() { this.map.clear(); }
}
const memoryPieces = new MemoryPieces(); // one for the whole visit, so "Try again" resumes

async function downloadPieces({ fetch, caches, onProgress, model, wait, digest }) {
  const url = remoteUrl();
  const parts = (await openCache(caches, PARTS_CACHE)) || memoryPieces;
  const count = pieceCount(model), pieces = new Array(count);
  let done = 0;

  // What an earlier try already kept.
  for (let n = 0; n < count; n++) {
    const kept = await parts.match(partKey(model, n));
    if (!kept) continue;
    const bytes = new Uint8Array(await kept.arrayBuffer());
    if (bytes.length === pieceSize(model, n)) { pieces[n] = bytes; done += bytes.length; } else await parts.delete(partKey(model, n));
  }
  onProgress(done / model.bytes);

  const failure = { status: 0, damaged: false };
  // Asks for one piece; returns its bytes, or { whole } if the server ignored the range and sent everything.
  async function ask(n) {
    const start = n * model.pieceBytes, size = pieceSize(model, n);
    const res = await fetch(url, { headers: { Range: `bytes=${start}-${start + size - 1}` } });
    if (res.status === 200) return { whole: await readAll(res, model, (got) => onProgress(got / model.bytes)) };
    if (res.status !== 206) { failure.status = res.status; throw new Error("status"); }
    const bytes = new Uint8Array(size);
    const reader = res.body.getReader();
    let got = 0;
    for (;;) {
      const { done: end, value } = await reader.read();
      if (end) break;
      if (got + value.length > size) throw new Error("too big");
      bytes.set(value, got);
      got += value.length;
      onProgress((done + got) / model.bytes);
    }
    if (got !== size) throw new Error("short");
    return { bytes };
  }
  // Checks a piece against its checksum (skipped when this page can't compute one).
  async function good(n, bytes) {
    const want = model.pieceSha256?.[n], have = want ? await digest(bytes) : null;
    return !have || have === want;
  }

  let whole = null;
  for (let n = 0; n < count && !whole; n++) {
    if (pieces[n]) continue;
    for (let attempt = 0; ; attempt++) {
      try {
        failure.status = 0;
        const got = await ask(n);
        if (got.whole) { whole = got.whole; break; }
        if (!(await good(n, got.bytes))) { failure.damaged = true; throw new Error("damaged"); }
        pieces[n] = got.bytes;
        break;
      } catch (err) {
        if (attempt >= WAITS.length) {
          if (failure.status) throw new Error(`Couldn't download the sound model (${failure.status}).`);
          if (failure.damaged) throw new Error("The sound model came through damaged, so that part was thrown away. Try again.");
          throw new Error("The connection dropped. Try again: it picks up where it stopped.");
        }
        await wait(WAITS[attempt]);
      }
    }
    if (whole) break;
    await parts.put(partKey(model, n), new Response(pieces[n]));
    done += pieces[n].length;
    onProgress(done / model.bytes);
  }
  // The server sent everything at once instead of a piece. That is checked piece by piece, and a bad one isn't retried.
  if (whole) return await wholeFile(whole, model, digest);

  const out = new Uint8Array(model.bytes);
  pieces.forEach((p, n) => out.set(p, n * model.pieceBytes));
  return out;
}

// The server sent the whole file instead of a piece: take it, and check it piece by piece.
async function wholeFile(bytes, model, digest) {
  if (bytes.length !== model.bytes) throw new Error("The sound model didn't download completely. Try again on Wi-Fi.");
  for (let n = 0; n < pieceCount(model); n++) {
    const want = model.pieceSha256?.[n], have = want ? await digest(bytes.subarray(n * model.pieceBytes, n * model.pieceBytes + pieceSize(model, n))) : null;
    if (have && have !== want) throw new Error("The sound model came through damaged. Try again.");
  }
  return bytes;
}

async function readAll(res, model, onProgress) {
  const out = new Uint8Array(model.bytes);
  const reader = res.body.getReader();
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (got + value.length > out.length) throw new Error("The sound model download was bigger than expected.");
    out.set(value, got);
    got += value.length;
    onProgress(got);
  }
  return out.subarray(0, got);
}

// Whether the model can load without a download: "local", "saved", or null. Downloads nothing.
export async function modelSaved({ fetch = globalThis.fetch, caches = globalThis.caches } = {}) {
  try {
    if ((await fetch(LOCAL_URL, { method: "HEAD" })).ok) return "local";
  } catch {
    // No local server, or no copy on it.
  }
  const cache = await openCache(caches, CACHE_NAME);
  if (cache && (await cache.match(remoteUrl()))) return "saved";
  return null;
}
