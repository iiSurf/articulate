// Where the app gets the scoring model: the local copy, then the browser's saved copy, then Hugging Face.
// fetch and Cache Storage are stood in for, so nothing is downloaded.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODEL, LOCAL_URL, CACHE_NAME, remoteUrl, modelBytes, VOCAB } from "../../js/score/source.js";

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
      };
    },
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

test("the first time, it downloads, reports progress, and saves a copy", async () => {
  const { fetch, calls } = fakeFetch({ [remoteUrl()]: full() });
  const caches = fakeCaches();
  const progress = [];
  const got = await modelBytes({ fetch, caches, onProgress: (p) => progress.push(p) });
  assert.equal(got.from, "download");
  assert.deepEqual(calls, [LOCAL_URL, remoteUrl()]);
  assert.equal(progress.at(-1), 1);
  assert.equal(caches.store.get(remoteUrl()).length, MODEL.bytes);
  assert.deepEqual(caches.opened, [CACHE_NAME]);
});

test("a download that stops short is not saved", async () => {
  const { fetch } = fakeFetch({ [remoteUrl()]: new Uint8Array(1000) });
  const caches = fakeCaches();
  await assert.rejects(modelBytes({ fetch, caches }), /didn't download completely/);
  assert.equal(caches.store.size, 0);
});

test("a broken saved copy is thrown away and downloaded again", async () => {
  const { fetch } = fakeFetch({ [remoteUrl()]: full() });
  const caches = fakeCaches({ [remoteUrl()]: new Uint8Array(10) });
  const got = await modelBytes({ fetch, caches });
  assert.equal(got.from, "download");
  assert.equal(caches.store.get(remoteUrl()).length, MODEL.bytes);
});

test("when Hugging Face can't be reached, it says so plainly", async () => {
  const { fetch } = fakeFetch({ [remoteUrl()]: 503 });
  await assert.rejects(modelBytes({ fetch, caches: fakeCaches() }), /Couldn't download the sound model \(503\)/);
});

test("the vocabulary kept in the app matches the model's sounds", () => {
  assert.equal(Object.keys(VOCAB).length, 42);
  assert.equal(VOCAB["[PAD]"], 41);
  assert.equal(new Set(Object.values(VOCAB)).size, 42);
});
