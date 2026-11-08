// Where the app gets the scoring model: the local copy, then the browser's saved copy, then Hugging Face.
// fetch and Cache Storage are stood in for, so nothing is downloaded.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODEL, LOCAL_URL, CACHE_NAME, remoteUrl, modelBytes, modelSaved, partialDownload, keepStorage, VOCAB } from "../../js/score/source.js";

const full = () => new Uint8Array(MODEL.bytes);

// A stand-in for fetch: answers from a table of URL → bytes (or a status number), and counts the calls.
function fakeFetch(table) {
  const calls = [];
  const fetch = async (url) => {
    calls.push(url);
    const hit = table[url];
    if (hit === undefined || typeof hit === "number") return new Response(null, { status: hit || 404 });
    return new Response(hit);
  };
  return { fetch, calls };
}

// A stand-in for Cache Storage with one cache.
function fakeCaches(start = {}) {
  const store = new Map(Object.entries(start));
  const opened = [];
  return {
    store, opened,
    async open(name) {
      opened.push(name);
      return {
        match: async (url) => (store.has(url) ? new Response(store.get(url)) : undefined),
        put: async (url, res) => { store.set(url, new Uint8Array(await res.arrayBuffer())); },
        delete: async (url) => store.delete(url),
        keys: async () => [...store.keys()].map((url) => ({ url })),
      };
    },
    has: async () => [...store.keys()].some((k) => k.includes("part-")),
    delete: async () => { for (const k of [...store.keys()]) if (k.includes("part-")) store.delete(k); return true; },
  };
}

test("the model is pinned to one version on Hugging Face", () => {
  assert.equal(remoteUrl(), `https://huggingface.co/${MODEL.repo}/resolve/${MODEL.revision}/${MODEL.file}`);
  assert.match(MODEL.revision, /^[0-9a-f]{40}$/);
  assert.match(MODEL.sha256, /^[0-9a-f]{64}$/);
  assert.ok(CACHE_NAME.startsWith("articulate."));
});

test("while developing, the local copy comes first and nothing is downloaded", async () => {
  const { fetch, calls } = fakeFetch({ [LOCAL_URL]: full() });
  const caches = fakeCaches();
  const got = await modelBytes({ fetch, caches });
  assert.equal(got.from, "local");
  assert.equal(got.bytes.length, MODEL.bytes);
  assert.deepEqual(calls, [LOCAL_URL]);
});

test("with no local copy, the browser's saved copy is used", async () => {
  const { fetch, calls } = fakeFetch({});
  const caches = fakeCaches({ [remoteUrl()]: full() });
  const got = await modelBytes({ fetch, caches });
  assert.equal(got.from, "saved");
  assert.deepEqual(calls, [LOCAL_URL]);
});

// A small stand-in for the model: 25 bytes in pieces of 10, with their checksums.
const bytesOf = (n) => Uint8Array.from({ length: n }, (_, i) => (i * 7 + 3) % 251);
const hex = async (b) => [...new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", b))].map((x) => x.toString(16).padStart(2, "0")).join("");
const FILE = bytesOf(25);
const SMALL = { ...MODEL, revision: "test-model", bytes: 25, pieceBytes: 10, pieceSha256: [await hex(FILE.slice(0, 10)), await hex(FILE.slice(10, 20)), await hex(FILE.slice(20, 25))] };
const noWait = async () => {};

// A stand-in server for the model with range requests. fail(n, tryNumber) returns a status to answer with instead
// (or "drop" to cut the connection, or "bad" to send damaged bytes); ignoreRange makes it send the whole file.
function rangeServer({ fail = () => null, ignoreRange = false } = {}) {
  const asked = [], tries = new Map();
  const fetch = async (url, init = {}) => {
    if (url === LOCAL_URL) return new Response(null, { status: 404 });
    const range = init.headers?.Range;
    if (!range || ignoreRange) { asked.push("whole"); return new Response(FILE); }
    const [, a, b] = /bytes=(\d+)-(\d+)/.exec(range), n = Number(a) / 10;
    asked.push(n);
    tries.set(n, (tries.get(n) || 0) + 1);
    const how = fail(n, tries.get(n));
    if (how === "drop") throw new TypeError("network down");
    if (typeof how === "number") return new Response(null, { status: how });
    const slice = FILE.slice(Number(a), Number(b) + 1);
    return new Response(how === "bad" ? slice.map((x) => x ^ 255) : slice, { status: 206 });
  };
  return { fetch, asked };
}

test("the first time, it downloads in pieces, reports progress, and saves one copy", async () => {
  const { fetch, asked } = rangeServer();
  const caches = fakeCaches();
  const progress = [];
  const got = await modelBytes({ fetch, caches, model: SMALL, wait: noWait, onProgress: (p) => progress.push(p) });
  assert.equal(got.from, "download");
  assert.deepEqual(Array.from(got.bytes), Array.from(FILE));
  assert.deepEqual(asked, [0, 1, 2]);
  assert.equal(progress[0], 0);
  assert.equal(progress.at(-1), 1);
  assert.ok(progress.every((p, i) => i === 0 || p >= progress[i - 1]), "progress never goes backwards");
  assert.equal(caches.store.get(remoteUrl()).length, 25);
  assert.deepEqual([...caches.store.keys()].filter((k) => k.includes("part-")), [], "the kept pieces are cleared once the whole file is saved");
});

test("a download that breaks keeps what came through, and the next try asks only for the rest", async () => {
  const caches = fakeCaches();
  const first = rangeServer({ fail: (n) => (n >= 2 ? "drop" : null) });
  await assert.rejects(modelBytes({ fetch: first.fetch, caches, model: SMALL, wait: noWait }), /connection dropped.*picks up where it stopped/);
  assert.deepEqual(await partialDownload({ caches, model: SMALL }), { done: 20, total: 25 });
  const second = rangeServer();
  const progress = [];
  const got = await modelBytes({ fetch: second.fetch, caches, model: SMALL, wait: noWait, onProgress: (p) => progress.push(p) });
  assert.deepEqual(second.asked, [2], "only the missing piece is asked for");
  assert.equal(progress[0], 20 / 25, "progress starts where it stopped");
  assert.deepEqual(Array.from(got.bytes), Array.from(FILE));
  assert.equal(await partialDownload({ caches, model: SMALL }), null);
});

test("a piece that fails is tried again by itself, with waits between", async () => {
  const waits = [];
  const { fetch, asked } = rangeServer({ fail: (n, t) => (n === 1 && t <= 2 ? 503 : null) });
  const got = await modelBytes({ fetch, caches: fakeCaches(), model: SMALL, wait: async (ms) => waits.push(ms) });
  assert.deepEqual(Array.from(got.bytes), Array.from(FILE));
  assert.deepEqual(asked, [0, 1, 1, 1, 2]);
  assert.equal(waits.length, 2);
  assert.ok(waits[1] > waits[0], "the waits get longer");
});

test("after the last try, it says what went wrong, in plain words", async () => {
  const { fetch, asked } = rangeServer({ fail: () => 503 });
  await assert.rejects(modelBytes({ fetch, caches: fakeCaches(), model: SMALL, wait: noWait }), /Couldn't download the sound model \(503\)/);
  assert.equal(asked.length, 4, "one try and three more");
});

test("a damaged piece is thrown away and asked for again, and never kept", async () => {
  const { fetch, asked } = rangeServer({ fail: (n, t) => (n === 0 && t === 1 ? "bad" : null) });
  const got = await modelBytes({ fetch, caches: fakeCaches(), model: SMALL, wait: noWait });
  assert.deepEqual(Array.from(got.bytes), Array.from(FILE));
  assert.deepEqual(asked, [0, 0, 1, 2]);
  const always = rangeServer({ fail: () => "bad" });
  const caches = fakeCaches();
  await assert.rejects(modelBytes({ fetch: always.fetch, caches, model: SMALL, wait: noWait }), /damaged/);
  assert.equal(await partialDownload({ caches, model: SMALL }), null, "nothing damaged was kept");
});

test("a kept piece that is the wrong size is replaced", async () => {
  const caches = fakeCaches({ ["https://articulate.invalid/test-model/part-0"]: new Uint8Array(3) });
  const { fetch, asked } = rangeServer();
  const got = await modelBytes({ fetch, caches, model: SMALL, wait: noWait });
  assert.deepEqual(asked, [0, 1, 2]);
  assert.deepEqual(Array.from(got.bytes), Array.from(FILE));
});

test("a server that ignores ranges and sends the whole file still works, and is checked piece by piece", async () => {
  const got = await modelBytes({ fetch: rangeServer({ ignoreRange: true }).fetch, caches: fakeCaches(), model: SMALL, wait: noWait });
  assert.deepEqual(Array.from(got.bytes), Array.from(FILE));
  const bad = { ...SMALL, pieceSha256: [SMALL.pieceSha256[0], "0".repeat(64), SMALL.pieceSha256[2]] };
  await assert.rejects(modelBytes({ fetch: rangeServer({ ignoreRange: true }).fetch, caches: fakeCaches(), model: bad, wait: noWait }), /damaged/);
});

test("with no Cache Storage, a retry in the same visit still resumes from memory", async () => {
  const first = rangeServer({ fail: (n) => (n === 2 ? "drop" : null) });
  await assert.rejects(modelBytes({ fetch: first.fetch, caches: null, model: SMALL, wait: noWait }), /connection dropped/);
  const second = rangeServer();
  const got = await modelBytes({ fetch: second.fetch, caches: null, model: SMALL, wait: noWait });
  assert.deepEqual(second.asked, [2]);
  assert.deepEqual(Array.from(got.bytes), Array.from(FILE));
  const third = rangeServer();
  await modelBytes({ fetch: third.fetch, caches: null, model: SMALL, wait: noWait });
  assert.deepEqual(third.asked, [0, 1, 2], "a finished download leaves nothing behind in memory");
});

test("a browser that refuses to open Cache Storage still downloads", async () => {
  const refusing = { open: async () => { throw new Error("SecurityError"); }, has: async () => { throw new Error("SecurityError"); } };
  const got = await modelBytes({ fetch: rangeServer().fetch, caches: refusing, model: SMALL, wait: noWait });
  assert.deepEqual(Array.from(got.bytes), Array.from(FILE));
  assert.equal(await modelSaved({ fetch: async () => new Response(null, { status: 404 }), caches: refusing }), null);
  assert.equal(await partialDownload({ caches: refusing, model: SMALL }), null);
});

test("without a way to compute checksums, pieces are still checked by size", async () => {
  const got = await modelBytes({ fetch: rangeServer().fetch, caches: fakeCaches(), model: SMALL, wait: noWait, digest: async () => null });
  assert.deepEqual(Array.from(got.bytes), Array.from(FILE));
});

test("when Hugging Face can't be reached, it says so plainly", async () => {
  const { fetch } = rangeServer({ fail: () => 503 });
  await assert.rejects(modelBytes({ fetch, caches: fakeCaches(), model: SMALL, wait: noWait }), /Couldn't download the sound model \(503\)/);
});

test("the browser is asked to keep the saved model, once the download starts", async () => {
  const asks = [];
  const storage = { persisted: async () => false, persist: async () => { asks.push("persist"); return true; } };
  await modelBytes({ fetch: rangeServer().fetch, caches: fakeCaches(), model: SMALL, wait: noWait, storage });
  assert.ok(asks.length >= 1);
  assert.equal(await keepStorage(storage), true);
  assert.equal(await keepStorage({ persisted: async () => true, persist: async () => assert.fail("already kept") }), true);
  assert.equal(await keepStorage({}), null);
  assert.equal(await keepStorage({ persist: async () => { throw new Error("no"); } }), null);
});

test("the real model's piece checksums cover the whole file, and match it when it's here", async () => {
  assert.equal(MODEL.pieceSha256.length, Math.ceil(MODEL.bytes / MODEL.pieceBytes));
  assert.ok(MODEL.pieceSha256.every((h) => /^[0-9a-f]{64}$/.test(h)));
  const file = new URL("../../.models/speako/onnx/model_quantized.onnx", import.meta.url);
  const { existsSync, openSync, readSync, closeSync, statSync } = await import("node:fs");
  if (!existsSync(file) || statSync(file).size !== MODEL.bytes) return; // run npm run get-model to include this check
  const fd = openSync(file, "r"), buf = new Uint8Array(MODEL.pieceBytes);
  try {
    for (let n = 0; n < MODEL.pieceSha256.length; n++) {
      const read = readSync(fd, buf, 0, MODEL.pieceBytes, n * MODEL.pieceBytes);
      assert.equal(await hex(buf.slice(0, read)), MODEL.pieceSha256[n], "piece " + n);
    }
  } finally { closeSync(fd); }
});

test("the vocabulary kept in the app matches the model's sounds", () => {
  assert.equal(Object.keys(VOCAB).length, 42);
  assert.equal(VOCAB["[PAD]"], 41);
  assert.equal(new Set(Object.values(VOCAB)).size, 42);
});

test("telling whether the model is already here, without downloading it", async () => {
  assert.equal(await modelSaved({ fetch: fakeFetch({ [LOCAL_URL]: new Uint8Array(1) }).fetch, caches: fakeCaches() }), "local");
  assert.equal(await modelSaved({ fetch: fakeFetch({}).fetch, caches: fakeCaches({ [remoteUrl()]: full() }) }), "saved");
  const { fetch, calls } = fakeFetch({ [remoteUrl()]: full() });
  assert.equal(await modelSaved({ fetch, caches: fakeCaches() }), null);
  assert.deepEqual(calls, [LOCAL_URL]);
});
