// Checks the resumable download end to end, in headless Chrome, with the REAL model and the REAL download code:
//   1. The page asks for the model in pieces. The test answers each request itself, from the local copy in
//      .models/ (so nothing is downloaded from the internet), with real ranges and real checksums.
//   2. Partway through (at piece 20 of 43) the "connection" breaks. The download stops with a plain message,
//      and the 20 pieces that came through are kept.
//   3. The window then offers to Continue, says how much is kept, and the next try asks ONLY for the missing pieces.
//   4. The finished file is the real model: it's saved, the pieces are cleared, and the model loads and runs.
// Heavy (about 355 MB moves between this script and the page, twice partly), so it takes a minute or two.
//
//   npm run check-resume
//
// Needs the model (npm run get-model). Runs anywhere Chrome and Node are.
import { closeSync, existsSync, openSync, readSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openChrome } from "./chrome.mjs";
import { startServer } from "./serve.mjs";
import { MODEL } from "../js/score/source.js";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(repo, ".models", "speako", ...MODEL.file.split("/"));
if (!existsSync(file) || statSync(file).size !== MODEL.bytes) throw new Error("The model isn't here. Run: npm run get-model");
const out = join(repo, ".tmp", "shots");
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fd = openSync(file, "r");
const results = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "✓" : "✗"} ${name}${ok || !detail ? "" : `: ${detail}`}`);
const BREAK_AT = 20;
const asked = [];
let breaking = true;

const server = await startServer();
const c = await openChrome();
try {
  await c.send("Page.enable");
  await c.send("Fetch.enable", { patterns: [{ urlPattern: "*/.models/*" }, { urlPattern: "*huggingface.co*" }] });
  c.on("Fetch.requestPaused", (p) => {
    const { url, headers } = p.request;
    const cors = [{ name: "Access-Control-Allow-Origin", value: "*" }, { name: "Access-Control-Expose-Headers", value: "*" }];
    if (!url.includes("huggingface.co")) { // the local copy isn't "here": the page has to download
      c.send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 404, responseHeaders: cors, body: "" });
      return;
    }
    const m = /bytes=(\d+)-(\d+)/.exec(headers.Range || headers.range || "");
    if (!m) { c.send("Fetch.failRequest", { requestId: p.requestId, errorReason: "Failed" }); return; }
    const start = Number(m[1]), end = Number(m[2]), n = Math.floor(start / MODEL.pieceBytes);
    asked.push(n);
    if (breaking && n >= BREAK_AT) { c.send("Fetch.failRequest", { requestId: p.requestId, errorReason: "InternetDisconnected" }); return; }
    const buf = Buffer.alloc(end - start + 1);
    readSync(fd, buf, 0, buf.length, start);
    c.send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 206, responseHeaders: [...cors, { name: "Content-Range", value: `bytes ${start}-${end}/${MODEL.bytes}` }], body: buf.toString("base64") });
  });

  await c.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await c.send("Page.navigate", { url: `${server.url}/` });
  await sleep(800);
  await c.evaluate(`localStorage.setItem("articulate.v1", JSON.stringify({ tour: { step: 0, done: true }, tipsSeen: ["speak", "words", "read", "listen"], mode: "speak", words: [{ text: "think", added: "2026-11-08" }], current: "think" }))`);
  await c.evaluate(`location.hash = "#/practice/speak"`);
  await sleep(300);
  await c.send("Page.reload");

  // 1 and 2: the first try breaks at piece 20
  for (let i = 0; i < 60 && !(await c.evaluate(`!!document.querySelector(".model-dialog[open]")`)); i++) await sleep(150);
  await c.evaluate(`document.getElementById("md-download").click()`);
  let stopped = null;
  for (let i = 0; i < 1200 && !stopped; i++) { stopped = await c.evaluate(`document.getElementById("md-retry") ? document.querySelector(".model-dialog").innerText : null`); if (!stopped) await sleep(250); }
  check("the first try stops partway, with a plain message", !!stopped && stopped.toLowerCase().includes("the download stopped"), stopped || "it never stopped");
  check("it only got as far as the break (4 tries for the piece that failed)", Math.max(...asked) === BREAK_AT && asked.filter((n) => n === BREAK_AT).length === 4, `asked up to ${Math.max(...asked)}, piece ${BREAK_AT} ${asked.filter((n) => n === BREAK_AT).length} times`);
  check("the message says what came through is kept", !!stopped && stopped.toLowerCase().includes("picks up where it stopped"), stopped);
  const kept = await c.evaluate(`(async () => { const { partialDownload } = await import("/js/score/source.js"); return partialDownload(); })()`);
  check(`the ${BREAK_AT} pieces that came through are kept`, kept?.done === BREAK_AT * MODEL.pieceBytes, JSON.stringify(kept));
  writeFileSync(join(out, "resume-stopped-390.png"), Buffer.from((await c.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));

  // 3: closing, coming back, and the window offers to continue
  await c.evaluate(`document.getElementById("md-later").click()`);
  await sleep(300);
  await c.evaluate(`location.hash = "#/practice/speak"`);
  await sleep(300);
  await c.send("Page.reload");
  for (let i = 0; i < 60 && !(await c.evaluate(`!!document.querySelector(".model-dialog[open]")`)); i++) await sleep(150);
  const intro = await c.evaluate(`document.querySelector(".model-dialog")?.innerText.replace(/\\s+/g, " ").toLowerCase()`);
  const pct = Math.round((100 * BREAK_AT * MODEL.pieceBytes) / MODEL.bytes);
  check("on the next visit the window says how much is already kept", !!intro && intro.includes(`you already have ${pct}%`) && intro.includes("picks up where it stopped"), intro);
  check("its button says Continue, with what's left", !!intro && /continue \(\d+ mb left\)/.test(intro), intro);
  writeFileSync(join(out, "resume-continue-390.png"), Buffer.from((await c.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));

  // 3 and 4: the connection is back; only the missing pieces are asked for, and the real model loads
  breaking = false;
  asked.length = 0;
  await c.evaluate(`document.getElementById("md-download").click()`);
  let finished = false;
  for (let i = 0; i < 1600 && !finished; i++) { finished = await c.evaluate(`!document.querySelector(".model-dialog") && !!document.querySelector(".toast")`); if (!finished) await sleep(250); }
  check("the second try finishes, and says Speak is ready", finished, await c.evaluate(`document.querySelector(".model-dialog")?.innerText ?? "no window"`));
  check("it asked only for the missing pieces", asked.length === 43 - BREAK_AT && Math.min(...asked) === BREAK_AT, `asked ${asked.length} pieces from ${Math.min(...asked)}`);
  const state = await c.evaluate(`(async () => {
    const { partialDownload, CACHE_NAME, remoteUrl, MODEL } = await import("/js/score/source.js");
    const cache = await caches.open(CACHE_NAME), saved = await cache.match(remoteUrl());
    return { saved: saved ? (await saved.arrayBuffer()).byteLength : 0, partial: await partialDownload(), parts: await caches.has("articulate.model.parts") };
  })()`);
  check("the whole model is saved in the browser, and the pieces are cleared", state.saved === MODEL.bytes && state.partial === null && state.parts === false, JSON.stringify(state));
  const ran = await c.evaluate(`(async () => {
    const { loadModel } = await import("/js/score/model.js");
    const model = await loadModel();
    const rows = await model.run(new Float32Array(16000).map((_, i) => Math.sin(i / 20) * 0.1));
    return { from: model.from, frames: rows.length, width: rows[0].length };
  })()`);
  check("the model that came through loads and runs", ran.frames > 40 && ran.width === 44, JSON.stringify(ran));
  await sleep(500);
  writeFileSync(join(out, "resume-ready-390.png"), Buffer.from((await c.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
} catch (err) {
  results.push(`✗ the check stopped: ${err.message}`);
} finally {
  closeSync(fd);
  await c.close();
  server.close();
}
console.log(results.join("\n"));
process.exitCode = results.some((r) => r.startsWith("✗")) ? 1 : 0;
