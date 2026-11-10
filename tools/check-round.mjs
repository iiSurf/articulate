// Checks Say it round end to end in headless Chrome with the REAL sound model: a stand-in microphone plays a recording
// for each word (some said right, some said wrong), the model scores them, and the round's words, marks, stars, recap,
// "Add these words", "Say think again", "Last round", and the history are checked. A second browser without the model
// checks that the round offers the download window. Takes pictures in .tmp/shots/.
//
//   npm run check-round
//
// Needs the model (npm run get-model) and the scoring test's recordings (npm run score-test, Mac only).
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openChrome } from "./chrome.mjs";
import { startServer } from "./serve.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(repo, ".tmp", "shots");
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "✓" : "✗"} ${name}${ok || !detail ? "" : `: ${detail}`}`);

// The round for TH starts with their own word, think (said as "sink" before), then four words from the tips.
// What the stand-in microphone plays for each, in order: think as sink, and the others right, except three said as tree.
const ROUND = ["think", "thank", "thin", "three", "thing"];
const PLAYS = ["sink", "thank", "thin", "tree", "thing"];
const wav = (name) => `/.tmp/score/wav/Samantha/${name}.wav`;
for (const p of PLAYS) if (!existsSync(join(repo, wav(p)))) throw new Error(`Missing ${wav(p)}. Run npm run score-test first, on a Mac.`);

// A stand-in microphone that plays the next recording in window.__plays each time it's asked for.
const microphone = `navigator.mediaDevices.getUserMedia = async () => {
  const url = (window.__plays ??= []).shift();
  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
  const source = ctx.createBufferSource(), dest = ctx.createMediaStreamDestination();
  source.buffer = buffer; source.connect(dest); source.start(ctx.currentTime + 0.4);
  return dest.stream;
};`;
const history = { think: [{ at: "2026-11-08T09:00:00.000Z", score: 22, bad: [["TH", "red", "th"]] }] };
const saved = { tour: { step: 0, done: true }, tipsSeen: ["speak", "words", "read", "listen", "progress"], words: [{ text: "think", added: "2026-11-08" }], current: "think", history };


// Watches the moving picture in a box for ms milliseconds: every label it showed, and every sound the label lit.
const watchPicture = (chrome, box, ms) => chrome.evaluate(`(async () => {
  const seen = new Set(), lit = new Set(), end = performance.now() + ${ms};
  while (performance.now() < end) {
    const p = document.querySelector(${JSON.stringify(box)} + " .mouth-panel");
    const svg = p?.querySelector("[data-mouth-fig] svg");
    if (svg) seen.add(/^Moving/.test(svg.getAttribute("aria-label")) ? "moving" : /^Side view: Ukrainian/.test(svg.getAttribute("aria-label")) ? "с" : "th");
    if (p) lit.add(p.dataset.phase);
    await new Promise((r) => setTimeout(r, 60));
  }
  return { seen: [...seen].sort(), lit: [...lit].sort() };
})()`);
const server = await startServer();
try {
  const chrome = await openChrome({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const text = (sel) => chrome.evaluate(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, " ").trim() ?? null`);
  const stored = async () => JSON.parse(await chrome.evaluate(`localStorage.getItem("articulate.v1")`));
  const shot = async (name) => writeFileSync(join(out, `${name}.png`), Buffer.from((await chrome.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
  const size = (width) => chrome.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: width < 768 ? 2 : 1, mobile: width < 768 });
  const sayWord = async (play) => {
    await chrome.evaluate(`window.__plays = [${JSON.stringify(wav(play))}]`);
    await chrome.evaluate(`document.getElementById("record").click()`);
    for (let i = 0; i < 60 && !(await text("#record"))?.toLowerCase().includes("stop"); i++) await sleep(100);
    await sleep(2300);
    await chrome.evaluate(`document.getElementById("record").click()`);
    for (let i = 0; i < 240 && !(await chrome.evaluate(`!!document.querySelector('.bigword [role="img"]') || !!document.querySelector(".round .note")`)); i++) await sleep(250);
  };
  try {
    await chrome.send("Page.enable");
    await chrome.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
    await chrome.send("Page.addScriptToEvaluateOnNewDocument", { source: microphone });
    await size(390);
    await chrome.send("Page.navigate", { url: `${server.url}/` });
    await sleep(800);
    await chrome.evaluate(`localStorage.setItem("articulate.v1", ${JSON.stringify(JSON.stringify(saved))}); location.hash = "#/round/TH"`);
    await chrome.send("Page.reload");
    for (let i = 0; i < 80 && !(await chrome.evaluate(`!!document.getElementById("begin")`)); i++) await sleep(150);
    check("the round opens with how to make the th, before any word", /how to make the th/i.test((await text(".round .label")) ?? "") && !!(await chrome.evaluate(`document.querySelector(".round .mouth-panel")`)) && !(await chrome.evaluate(`document.getElementById("record")`)));
    await sleep(1200);
    const intro = await watchPicture(chrome, ".round", 6200);
    check("the move from с to th plays by itself as the round opens, and loops", JSON.stringify(intro.seen) === '["moving","th","с"]', JSON.stringify(intro));
    await shot("round-intro-390");
    check("Start says how many words", (await text("#begin")) === "Start: 5 words");
    await chrome.evaluate(`document.getElementById("begin").click()`);
    await sleep(300);

    check("the band says Say it round, with a way back to Progress", (await text(".band .brand")) === "Say it round" && (await chrome.evaluate(`document.querySelector(".band .back")?.getAttribute("href")`)) === "#/progress");
    check("the Progress tab stays lit", (await text(".tabs a.on")) === "Progress");

    await shot("round-start-390");
    for (let n = 0; n < ROUND.length; n++) {
      const label = (await text(".round .label"))?.toLowerCase(); // the headings are in capitals on the page
      check(`word ${n + 1}: "Word ${n + 1} of 5" and the word is ${ROUND[n]}`, label === `word ${n + 1} of 5` && (await text(".bigword")) === ROUND[n], `${label} / ${await text(".bigword")}`);
      await sayWord(PLAYS[n]);
      const graded = await chrome.evaluate(`[...document.querySelectorAll('.bigword [role="img"]')].map((p) => p.getAttribute("aria-label"))`);
      check(`word ${n + 1} (${ROUND[n]}, said as ${PLAYS[n]}): every part gets a grade`, graded.length >= 2, JSON.stringify(graded));
      if (n === 0) {
        check("think said as sink: the th isn't good, and it says what it sounded like", !/^th good/.test(graded[0]) && /sounded like/.test((await text(".round .hint")) ?? ""), `${graded[0]} / ${await text(".round .hint")}`);
        await sleep(200);
        await shot("round-word-390");
        check("the picture for the th is beside the word, with the tip, and Ukrainian letters marked", /How to make th/i.test((await text(".round .how .mouth-title")) ?? "") && /Start from the Ukrainian/.test((await text(".round .how .mouth-tip")) ?? "") && (await chrome.evaluate(`document.querySelectorAll('.round .how [lang="uk"]').length`)) >= 2);
        check("after think said as sink, the picture shows what it came out as: s", (await text(".round .how .mc-said")) === "You said: s", await text(".round .how .mc-said"));
        const side = await watchPicture(chrome, ".round .how", 6200);
        check("the picture beside the word keeps moving by itself, from с to th and back", JSON.stringify(side.seen) === '["moving","th","с"]', JSON.stringify(side));
        // The phone asking for less motion: the move is the lesson, so it still moves.
        await chrome.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }, { name: "prefers-reduced-motion", value: "reduce" }] });
        const calm = await watchPicture(chrome, ".round .how", 6200);
        check("with the phone set to reduce motion, the picture still moves (it's the lesson, not decoration)", JSON.stringify(calm.seen) === '["moving","th","с"]', JSON.stringify(calm));
        await chrome.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
        await chrome.evaluate(`document.querySelector(".round .how [data-mouth-pause]").click()`);
        await sleep(200);
        const paused = await watchPicture(chrome, ".round .how", 2500);
        check("the pause button stops it on th, and says Play", JSON.stringify(paused.seen) === '["th"]' && (await chrome.evaluate(`document.querySelector(".round .how [data-mouth-pause]").getAttribute("aria-label")`)) === "Play the moving picture", JSON.stringify(paused));
        await chrome.evaluate(`document.querySelector(".round .how [data-mouth-pause]").click()`);
        const again = await watchPicture(chrome, ".round .how", 3000);
        check("and Play starts it again", again.seen.includes("moving"), JSON.stringify(again));
        for (const width of [390, 1280]) {
          await size(width);
          await sleep(300);
          const box = await chrome.evaluate(`(() => { const a = document.querySelector(".round > .card.center").getBoundingClientRect(), b = document.querySelector(".round > .how").getBoundingClientRect(); return { side: b.left >= a.right - 1, below: b.top >= a.bottom - 1 }; })()`);
          check(`at ${width} wide the picture is ${width > 900 ? "on the side" : "under the word"}`, width > 900 ? box.side : box.below, JSON.stringify(box));
          await shot(`round-picture-${width}`);
        }
        await size(390);
      }
      check(`word ${n + 1}: the next button says ${n === 4 ? "See results" : "Next word"}`, (await text("#next")) === (n === 4 ? "See results" : "Next word"), await text("#next"));
      await chrome.evaluate(`document.getElementById("next").click()`);
      await sleep(250);
    }

    const cele = await chrome.evaluate(`(() => { const c = document.querySelector(".cele"); return c && { right: +c.querySelector(".cc.right b").textContent, wrong: +c.querySelector(".cc.wrong b").textContent }; })()`);
    check("the round ends with a celebration: how many came out good and how many to work on", !!cele && cele.right + cele.wrong === 5 && cele.right >= 1, JSON.stringify(cele));
    await shot("round-cele-390");
    await chrome.evaluate(`document.getElementById("cele-go").click()`);
    await sleep(200);
    check("the round is over: stars and a recap of five words", (await text(".round .label"))?.toLowerCase() === "round done" && (await chrome.evaluate(`document.querySelectorAll(".recap > div").length`)) === 5, await text(".round"));
    const starsSaid = await chrome.evaluate(`document.querySelector(".stars")?.getAttribute("aria-label")`);
    const n = Number(starsSaid?.match(/^(\d)/)?.[1]);
    check(`some words came out good, and the stars say how many (${starsSaid})`, n >= 2 && n <= 4, starsSaid);
    const recap = await chrome.evaluate(`[...document.querySelectorAll(".recap > div")].map((d) => d.innerText.replace(/\\s+/g, " "))`);
    check("think (said as sink) says which part went wrong: the th", /^think th (needs work|was a little off|was close)/.test(recap[0]), recap[0]);
    check("thank said right isn't marked as needing work", /^thank/.test(recap[1]) && !/needs work/.test(recap[1]), recap[1]);
    check("three said as tree isn't marked good", !/^three good/.test(recap[3]), recap[3]);
    check("it says how many came out good, and there's no Last round the first time", /^\d of 5 words came out good\.$/.test((await text(".round p b")) ?? "") && !/Last round/.test((await text(".round")) ?? ""));
    await shot("round-done-390");

    const after = await stored();
    check("every try is in the history: think now has two, the others one", after.history.think?.length === 2 && ["thank", "thin", "three", "thing"].every((w) => after.history[w]?.length === 1), JSON.stringify(Object.fromEntries(Object.entries(after.history).map(([k, v]) => [k, v.length]))));
    check("the round's stars are saved for next time", after.rounds?.TH?.stars === n, JSON.stringify(after.rounds));

    await chrome.evaluate(`document.getElementById("add").click()`);
    await sleep(300);
    const added = await stored();
    check("Add these words puts the four new words in My words (think was there already)", ["thank", "thin", "three", "thing"].every((w) => added.words.some((x) => x.text === w)) && added.words.length === 5, JSON.stringify(added.words.map((w) => w.text)));
    check("and says so, and the button goes away", /Added 4 words/.test((await text(".round .hint")) ?? "") && !(await chrome.evaluate(`!!document.getElementById("add")`)), await text(".round .hint"));
    for (const width of [360, 390, 1280]) {
      await size(width);
      await sleep(250);
      check(`at ${width} wide the round's end doesn't scroll sideways`, (await chrome.evaluate("document.documentElement.scrollWidth")) <= width, String(await chrome.evaluate("document.documentElement.scrollWidth")));
      await shot(`round-done-${width}`);
    }
    await size(390);

    await chrome.evaluate(`document.getElementById("again").click()`);
    await sleep(300);
    check("Play again starts over at word 1", (await text(".round .label"))?.toLowerCase() === "word 1 of 5");
    for (let i = 0; i < 5; i++) { await chrome.evaluate(`document.getElementById("next").click()`); await sleep(150); }
    check("a round of only skipped words has nothing to celebrate", !(await chrome.evaluate(`!!document.querySelector(".cele")`)));
    check("a round of skipped words says Last round, with the one before", new RegExp(`Last round: ${n} of 5`).test((await text(".round p")) ?? "") && /0 of 5 words/.test((await text(".round p")) ?? ""), await text(".round p"));
    check("skipped words are marked skipped", (await chrome.evaluate(`[...document.querySelectorAll(".recap .st")].every((s) => s.textContent === "skipped")`)));

    await chrome.evaluate(`document.getElementById("say").click()`);
    await sleep(500);
    const end = await stored();
    check("Say think again opens Speak with think", (await chrome.evaluate("location.hash")) === "#/practice/speak" && end.current === "think", `${await chrome.evaluate("location.hash")} ${end.current}`);

    await chrome.evaluate(`location.hash = "#/round/ZZ"`);
    await sleep(500);
    check("a sound with no words says so, with a way back", /no round for that sound/.test((await text("main")) ?? "") && !!(await chrome.evaluate(`document.querySelector('main a[href="#/progress"]')`)));
  } finally {
    await chrome.close();
  }

  // Without the model: the round asks for the download, in the same window as Speak.
  const bare = await openChrome();
  try {
    await bare.send("Page.enable");
    await bare.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await bare.send("Fetch.enable", { patterns: [{ urlPattern: "*/.models/*" }, { urlPattern: "*huggingface.co*" }] });
    bare.on("Fetch.requestPaused", (p) => bare.send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 404, responseHeaders: [{ name: "Access-Control-Allow-Origin", value: "*" }], body: "" }));
    await bare.send("Page.navigate", { url: `${server.url}/` });
    await sleep(800);
    await bare.evaluate(`localStorage.setItem("articulate.v1", ${JSON.stringify(JSON.stringify(saved))}); location.hash = "#/round/TH"`);
    await bare.send("Page.reload");
    await sleep(1500);
    const need = await bare.evaluate(`document.querySelector(".round-need")?.innerText.replace(/\\s+/g, " ") ?? null`);
    check("without the model, the round says it needs it, and offers Get the sound model", /needs the sound model/.test(need ?? "") && /Get the sound model/.test(need ?? ""), need);
    await bare.evaluate(`document.getElementById("get-model").click()`);
    await sleep(400);
    check("the button opens the one-time download window", await bare.evaluate(`!!document.querySelector("dialog.model-dialog[open]")`));
    writeFileSync(join(out, "round-need-model-390.png"), Buffer.from((await bare.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
  } finally {
    await bare.close();
  }
} catch (err) {
  results.push(`✗ the check stopped: ${err.message}`);
} finally {
  server.close();
}
console.log(results.join("\n"));
process.exitCode = results.some((r) => r.startsWith("✗")) ? 1 : 0;
