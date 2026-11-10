// Checks Five minutes end to end in headless Chrome with the REAL sound model: Home shows the plan, Start runs it
// (three listening questions with a stand-in voice that records the word it was asked to say, the picture, then three
// words said by a stand-in microphone), and the summary. Then Quiet, a browser without the model, and a sound's page.
// Takes pictures in .tmp/shots/.
//
//   npm run check-session
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
const wav = (name) => `/.tmp/score/wav/Samantha/${name}.wav`;
for (const p of ["sink", "thank"]) if (!existsSync(join(repo, wav(p)))) throw new Error(`Missing ${wav(p)}. Run npm run score-test first, on a Mac.`);

// A stand-in voice that records what it was asked to say, and a stand-in microphone that plays the next recording.
const stubs = `(() => {
  window.__said = [];
  // A stand-in for the browser's sound maker that writes down every note's pitch (the tap is 640, the right chime 660 and 990).
  window.__tones = [];
  window.__RealAC = window.AudioContext;
  window.AudioContext = function () {
    return { currentTime: 0, state: "running", destination: {}, resume() {},
      createOscillator() { return { type: "", frequency: { setValueAtTime(f) { window.__tones.push(f); }, exponentialRampToValueAtTime() {} }, connect(g) { return g; }, start() {}, stop() {} }; },
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect(d) { return d; } }; } };
  };
  Object.defineProperty(window, "speechSynthesis", { value: { speak(u) { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }, cancel() {}, getVoices: () => [] }, configurable: true });
  navigator.mediaDevices.getUserMedia = async () => {
    const url = (window.__plays ??= []).shift();
    const ctx = new window.__RealAC();
    const buffer = await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
    const source = ctx.createBufferSource(), dest = ctx.createMediaStreamDestination();
    source.buffer = buffer; source.connect(dest); source.start(ctx.currentTime + 0.4);
    return dest.stream;
  };
})()`;
const T = (score, bad) => ({ at: "2026-11-09T09:00:00.000Z", score, bad: bad ? [bad] : [] });
const saved = (extra = {}) => JSON.stringify({ tour: { step: 0, done: true }, tipsSeen: ["speak", "words", "read", "listen", "progress"], mode: "speak",
  words: [{ text: "think", added: "2026-11-08" }], current: "think", history: { think: [T(22, ["TH", "red", "th"]), T(30, ["TH", "red", "th"])] }, ...extra });

const server = await startServer();
try {
  const chrome = await openChrome({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const text = (sel) => chrome.evaluate(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, " ").trim() ?? null`);
  const click = async (sel, wait = 200) => { await chrome.evaluate(`document.querySelector(${JSON.stringify(sel)}).click()`); await sleep(wait); };
  const shot = async (name) => writeFileSync(join(out, `${name}.png`), Buffer.from((await chrome.send("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
  const size = (width) => chrome.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: width < 768 ? 2 : 1, mobile: width < 768 });
  const visit = async (data, hash) => {
    await chrome.send("Page.navigate", { url: `${server.url}/` });
    await sleep(700);
    await chrome.evaluate(`localStorage.setItem("articulate.v1", ${JSON.stringify(data)}); location.hash = ${JSON.stringify(hash)}`);
    await chrome.send("Page.reload");
    await sleep(1400);
  };
  try {
    await chrome.send("Page.enable");
    await chrome.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
    await chrome.send("Page.addScriptToEvaluateOnNewDocument", { source: stubs });
    await size(390);
    await visit(saved(), "#/words");
    for (let i = 0; i < 20 && !(await chrome.evaluate(`!!document.querySelector(".plan-list")`)); i++) await sleep(150);
    const lines = await chrome.evaluate(`[...document.querySelectorAll(".plan-list li")].map((l) => l.textContent.trim())`);
    check("Home shows five minutes: look first, then listen, then say, their own word first", (await text("#hero-title")) === "5 minutes" && lines.length === 3 && lines[0] === "See how to make the th" && /^Hear the difference: /.test(lines[1]) && lines[2] === "Say think, thank, and thin", JSON.stringify(lines));
    check("Home's card for the hardest sound opens its page", (await chrome.evaluate(`document.querySelector('.home-body a.row-card')?.getAttribute("href")`)) === "#/sound/TH");
    await shot("session-home-390");
    const firstPair = lines[1].replace("Hear the difference: ", "").split(" · ");
    await chrome.evaluate("window.__tones = []");
    await click("#start", 900);
    check("pressing a button makes a soft tap", (await chrome.evaluate("window.__tones")).includes(640), JSON.stringify(await chrome.evaluate("window.__tones")));
    check("Start opens the practice, with a bar of 7 steps and a way to stop", (await chrome.evaluate("location.hash")) === "#/session" && (await chrome.evaluate(`document.querySelectorAll(".steps-bar i").length`)) === 7 && (await text(".band .brand")) === "Five minutes");
    check("the first step is the picture: how to make the th, from the Ukrainian с", /How to make th/i.test((await text(".mouth-title")) ?? "") && !!(await chrome.evaluate(`document.querySelector('[data-mouth-show="move"]')`)));
    await sleep(900);
    const moving = await chrome.evaluate(`document.querySelector("[data-mouth-fig] svg").getAttribute("aria-label")`);
    await sleep(2000);
    const settled = await chrome.evaluate(`document.querySelector("[data-mouth-fig] svg").getAttribute("aria-label")`);
    check("the move from с to th plays by itself, and stops on th", /Moving from the Ukrainian с/.test(moving) && /between the teeth/.test(settled), `${moving} / ${settled}`);
    await shot("session-look-390");
    await click("#next", 400);

    // Three listening questions: the voice says the word by itself; right, wrong, right.
    let right = 0;
    for (let q = 0; q < 3; q++) {
      const said = (await chrome.evaluate("window.__said")).at(-1);
      const choices = await chrome.evaluate(`[...document.querySelectorAll("[data-choice]")].map((b) => b.dataset.choice)`);
      if (q === 0) check("the first question is the pair Home showed, said by itself", JSON.stringify([...choices].sort()) === JSON.stringify([...firstPair].sort()) && choices.includes(said), `${choices} / ${said}`);
      const pick = q === 1 ? choices.find((w) => w !== said) : said;
      if (pick === said) right++;
      await chrome.evaluate("window.__tones = []");
      await click(`[data-choice="${pick}"]`);
      const tones = await chrome.evaluate("window.__tones");
      if (q < 2) check(`a ${pick === said ? "right" : "wrong"} answer plays its own sound, not the tap`, pick === said ? tones.includes(990) && !tones.includes(640) : tones.includes(262) && !tones.includes(640), JSON.stringify(tones));
      if (q === 1) check("a wrong answer says what it was", (await text(".verdict")) === `It was ${said}, not ${pick}.`, await text(".verdict"));
      await click("#next", 300);
    }

    // Three words: think (said as sink), thank (said right), thin (skipped).
    let tapsOnMic = 0;
    const sayWord = async (play) => {
      await chrome.evaluate(`window.__plays = [${JSON.stringify(wav(play))}]; window.__tones = []`);
      await click("#record", 0);
      tapsOnMic += (await chrome.evaluate("window.__tones")).filter((t) => t === 640).length;
      for (let i = 0; i < 60 && !(await text("#record"))?.toLowerCase().includes("stop"); i++) await sleep(100);
      await sleep(2300);
      await click("#record", 0);
      for (let i = 0; i < 240 && !(await chrome.evaluate(`!!document.querySelector('.say-word [role="img"]') || !!document.querySelector(".say-step .note")`)); i++) await sleep(250);
    };
    check("say step 1 is their own word, think", (await text(".say-word")) === "think" && (await text(".prompt")) === "Say this word");
    await shot("session-say-390");
    await sayWord("sink");
    const graded = await chrome.evaluate(`[...document.querySelectorAll('.say-word [role="img"]')].map((p) => p.getAttribute("aria-label"))`);
    check("think said as sink: every part graded, the th not good, and it says what it sounded like", graded.length >= 3 && !/^th good/.test(graded[0]) && /sounded like/.test((await text(".say-step .hint")) ?? ""), `${graded} / ${await text(".say-step .hint")}`);
    await shot("session-said-390");
    await click("#next", 300);
    check("say step 2 is thank", (await text(".say-word")) === "thank");
    await sayWord("thank");
    await click("#next", 300);
    check("say step 3 is thin, and it can be skipped", (await text(".say-word")) === "thin" && (await text("#next")) === "Skip");
    check("the microphone button never taps, so no click ends up in a recording", tapsOnMic === 0, String(tapsOnMic));
    await chrome.evaluate("window.__tones = []");
    await click("#next", 600);
    const cele = await chrome.evaluate(`(() => { const c = document.querySelector(".cele"); return c && { title: c.querySelector("h2").textContent, right: +c.querySelector(".cc.right b").textContent, wrong: +c.querySelector(".cc.wrong b").textContent, note: c.querySelector(".cele-note")?.textContent }; })()`);
    check("the end of the lesson is a celebration: Lesson complete!, how many right and how many to work on", cele?.title === "Lesson complete!" && cele.right + cele.wrong === 5 && cele.right >= right && cele.note === "All about the th", JSON.stringify(cele));
    check("with a fanfare", (await chrome.evaluate("window.__tones")).includes(1047));
    await shot("session-cele-390");
    await click("#cele-go", 300);
    check("Continue closes it and shows the summary", !(await chrome.evaluate(`!!document.querySelector(".cele")`)) && (await text(".done-title")) === "Nice work!");

    const rows = await chrome.evaluate(`[...document.querySelectorAll(".sum li")].map((li) => li.innerText.replace(/\\s+/g, " ").trim())`);
    check("the summary: think before and now, thank's score, thin skipped, and the listening count", (await text(".done-title")) === "Nice work!" && /^think 26 → \d+$/.test(rows[0]) && /^thank \d+$/.test(rows[1]) && rows[2] === "thin skipped" && rows[3] === `th by ear ${right} of 3 right`, JSON.stringify(rows));
    await shot("session-done-390");
    const after = JSON.parse(await chrome.evaluate(`localStorage.getItem("articulate.v1")`));
    check("the tries are in the history, so the boards move", after.history.think.length === 3 && after.history.thank?.length === 1 && !after.history.thin, JSON.stringify(Object.fromEntries(Object.entries(after.history).map(([k, v]) => [k, v.length]))));
    for (const width of [360, 1280]) {
      await size(width);
      await sleep(250);
      check(`at ${width} wide the summary doesn't scroll sideways`, (await chrome.evaluate("document.documentElement.scrollWidth")) <= width);
    }
    await size(390);
    await click("#again", 1200);
    check("One more round starts a new practice", (await chrome.evaluate("location.hash")) === "#/session" && (await chrome.evaluate(`document.querySelectorAll(".steps-bar i").length`)) >= 5);

    // Quiet: listening and the picture only.
    await visit(saved({ mode: "listen" }), "#/words");
    for (let i = 0; i < 20 && !(await chrome.evaluate(`!!document.querySelector(".plan-list")`)); i++) await sleep(150);
    await click("#start", 900);
    const kinds = await chrome.evaluate(`document.querySelectorAll(".steps-bar i").length`);
    check("Quiet: the picture, then five listening questions, no saying", kinds === 6 && !!(await chrome.evaluate(`document.querySelector(".session .mouth-panel")`)), String(kinds));

    // Sounds off (Your colors): no tap.
    await visit(saved({ sounds: false }), "#/colors");
    check("Your colors has the Sounds switch, off here", (await chrome.evaluate(`document.getElementById("sounds")?.checked`)) === false);
    await chrome.evaluate("window.__tones = []");
    await click("#tour-again", 300);
    check("with sounds off, pressing a button is silent", (await chrome.evaluate("window.__tones")).length === 0, JSON.stringify(await chrome.evaluate("window.__tones")));

    // A sound's page.
    await visit(saved(), "#/sound/TH");
    const page = await chrome.evaluate(`({ title: document.querySelector(".sound-title")?.textContent, picture: !!document.querySelector(".mouth-panel [data-mouth-fig] svg"), say: document.querySelector('.act.yellow')?.getAttribute("href"), hear: document.querySelector('a.act[href^="#/hear/"]')?.getAttribute("href"), mine: [...document.querySelectorAll(".mine b")].map((b) => b.textContent), more: [...document.querySelectorAll("[data-say]")].length })`);
    check("the th's page: its name, the picture, Say 5 words, Hear the difference, your words with it, and more to hear", page.title === "th, as in think" && page.picture && page.say === "#/round/TH" && page.hear === "#/hear/TH" && JSON.stringify(page.mine) === '["think"]' && page.more >= 4, JSON.stringify(page));
    await shot("sound-page-390");
    await size(1280);
    await sleep(250);
    check("at 1280 wide the sound page doesn't scroll sideways", (await chrome.evaluate("document.documentElement.scrollWidth")) <= 1280);
    await shot("sound-page-1280");
  } finally {
    await chrome.close();
  }

  // Without the model: the practice asks for it, or skips saying words today.
  const bare = await openChrome();
  try {
    await bare.send("Page.enable");
    await bare.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await bare.send("Page.addScriptToEvaluateOnNewDocument", { source: stubs });
    await bare.send("Fetch.enable", { patterns: [{ urlPattern: "*/.models/*" }, { urlPattern: "*huggingface.co*" }] });
    bare.on("Fetch.requestPaused", (p) => bare.send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 404, responseHeaders: [{ name: "Access-Control-Allow-Origin", value: "*" }], body: "" }));
    await bare.send("Page.navigate", { url: `${server.url}/` });
    await sleep(800);
    await bare.evaluate(`localStorage.setItem("articulate.v1", ${JSON.stringify(saved())}); location.hash = "#/session"`);
    await bare.send("Page.reload");
    await sleep(1800);
    const need = await bare.evaluate(`document.querySelector(".session")?.innerText.replace(/\\s+/g, " ") ?? null`);
    check("without the model, the practice offers the download or skipping the saying", /needs one download/i.test(need ?? "") && /Skip saying words today/.test(need ?? ""), need);
    await bare.evaluate(`document.getElementById("skip-say").click()`);
    await sleep(300);
    check("skipping the saying leaves the picture and the listening", (await bare.evaluate(`document.querySelectorAll(".steps-bar i").length`)) === 4 && (await bare.evaluate(`!!document.querySelector(".session .mouth-panel")`)));
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
